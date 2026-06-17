import mysql from 'mysql2/promise';
import * as fs from 'node:fs';

const html = fs.readFileSync('AviaryIndex.html', { encoding: 'utf8' });
const css = fs.readFileSync('Aviary.css', { encoding: 'utf8' });
const js = fs.readFileSync('Aviary.js', { encoding: 'utf8' });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export const handler = async (event) => {

  if (event.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  try {
    const method = event.requestContext?.http?.method || "GET";
    const search = event.queryStringParameters?.search || "";
    const action = event.queryStringParameters?.action || "";
    const region = event.queryStringParameters?.region || "North_East";
    const color = event.queryStringParameters?.color || "";

    const allowedRegions = ["All_Birds", "North_East", "South", "Mid_West", "West"];

    if (event.rawPath.endsWith(".css")) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "text/css" },
        body: css
      };
    }

    if (event.rawPath.endsWith(".js")) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/javascript" },
        body: js
      };
    }

    if (event.rawPath.endsWith(".png")) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "image/png" },
        body: fs.readFileSync("AviaryLogo.png").toString("base64"),
        isBase64Encoded: true
      };
    }

    const connection = await mysql.createConnection({
      host: 'mysql-database-1.cri4sm222x9n.us-east-2.rds.amazonaws.com',
      user: 'admin',
      password: process.env.DB_PASSWORD,
      database: 'AviaryIndex'
    });

    // =========================
    // GET
    // =========================
    if (method === "GET") {

      const hasQuery =
        event.queryStringParameters &&
        Object.keys(event.queryStringParameters).length > 0;

      if (!hasQuery) {
        await connection.end();
        return {
          statusCode: 200,
          headers: { ...corsHeaders, "Content-Type": "text/html" },
          body: html
        };
      }


      if (event.queryStringParameters?.exact === "true") {

        const tables = ["North_East", "South", "Mid_West", "West"];

        for (const tbl of tables) {
          const [result] = await connection.execute(
            `SELECT *, '${tbl}' AS region FROM ${tbl} WHERE Name LIKE ?`,
            [`%${search}%`]
          );

          if (result.length > 0) {
            await connection.end();
            return {
              statusCode: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              body: JSON.stringify(result)
            };
          }
        }

        await connection.end();
        return {
          statusCode: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify([])
        };
      }

      let rows = [];

      const tables = ["North_East", "South", "Mid_West", "West"];

      let selectedRegions;

      if (region === "All_Birds") {
        selectedRegions = tables;
      } else if (region.includes(",")) {
        selectedRegions = region.split(",");
      } else {
        selectedRegions = [region];
      }

      for (const reg of selectedRegions) {

        let query = `SELECT *, '${reg}' AS region FROM ${reg} WHERE 1=1`;
        let values = [];

        if (search) {
          query += " AND (Name LIKE ? OR Description LIKE ?)";
          values.push(`%${search}%`, `%${search}%`);
        }

        if (color) {
          const colors = color.split(",");
          query += ` AND (${colors.map(() => "color LIKE ?").join(" OR ")})`;
          values.push(...colors.map(c => `%${c}%`));
        }

        const [result] = await connection.execute(query, values);
        rows = rows.concat(result);
      }

      await connection.end();

      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify(rows)
      };
    }

    // =========================
    // POST
    // =========================
    if (method === "POST") {

      const body = JSON.parse(event.body);

      if (action === "signup") {
        await connection.execute(
          "INSERT INTO Users (username, password) VALUES (?, ?)",
          [body.username, body.password]
        );

        await connection.end();

        return {
          statusCode: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ message: "Signup successful!" })
        };
      }

      if (action === "login") {
        const [rows] = await connection.execute(
          "SELECT * FROM Users WHERE username = ? AND password = ?",
          [body.username, body.password]
        );

        await connection.end();

        return {
          statusCode: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            success: rows.length > 0,
            message: rows.length > 0 ? "" : "Invalid username or password."
          })
        };
      }

      const regionInsert = body.region || "North_East";

      if (!allowedRegions.includes(regionInsert)) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: "Invalid region"
        };
      }

      await connection.execute(
        `INSERT INTO ${regionInsert}
        (Name, Size, color, egg_size, egg_color, migration_p)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          body.name,
          body.size,
          body.color,
          body.egg_size,
          body.egg_color,
          body.migration_p
        ]
      );

      await connection.end();

      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Inserted" })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
      body: "Server Error: " + error.message
    };
  }
};