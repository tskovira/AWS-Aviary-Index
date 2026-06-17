const API_URL = "https://ytmvuortakcquzqnpzn6vckwma0fbdbx.lambda-url.us-east-2.on.aws/";

/* 
   LOGIN/SIGNUP
*/
async function signupUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    document.getElementById("authMessage").textContent =
      "Please enter username and password.";
    return;
  }

  const response = await fetch(API_URL + "?action=signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  document.getElementById("authMessage").textContent = result.message;
}

async function loginUser() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const response = await fetch(API_URL + "?action=login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();

  if (result.success) {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
    loadBirds();
  } else {
    document.getElementById("authMessage").textContent =
      result.message || "Login failed.";
  }
}

/* 
   MAIN FUNCTIONS
*/
async function loadBirds() {
  const region = document.getElementById("regionSelect").value;

  const response = await fetch(
    `${API_URL}?load=true&region=${region}`
  );

  const birds = await response.json();
  displayBirds(birds);
}

async function searchBirds() {
  const search = document.getElementById("keywordSearch").value.trim();

  const regions = Array.from(document.querySelectorAll(".region-filter:checked"))
    .map(cb => cb.value);

  const colors = Array.from(document.querySelectorAll(".color-filter:checked"))
    .map(cb => cb.value);

  let params = [];

  if (search) {
    params.push(`search=${encodeURIComponent(search)}`);
  }

  if (regions.includes("All_Birds") || regions.length === 0) {
    params.push(`region=All_Birds`);
  } else {
    params.push(`region=${regions.join(",")}`);
  }

  if (colors.length > 0) {
    params.push(`color=${colors.join(",")}`);
  }

  const queryString = params.join("&");

  const response = await fetch(`${API_URL}?${queryString}`);
  const birds = await response.json();

  displayBirds(birds);
}

function displayBirds(list) {
  const grid = document.getElementById("resultsGrid");
  grid.innerHTML = "";

  list.forEach(bird => {
    bird.region = bird.region || "UNKNOWN";
    const card = document.createElement("div");
    card.className = "bird-card";

    card.innerHTML = `
      <div class="bird-title">${bird.Name ?? ""}</div>

      <div class="bird-info"><strong>Size:</strong> ${bird.Size ?? ""} cm</div>
      <div class="bird-info"><strong>Color:</strong> ${bird.color ?? ""}</div>
      <div class="bird-info"><strong>Egg Size:</strong> ${bird.egg_size ?? ""} cm</div>
      <div class="bird-info"><strong>Egg Color:</strong> ${bird.egg_color ?? ""}</div>
      <div class="bird-info"><strong>Migration:</strong> ${bird.migration_p ?? ""}</div>
    `;

    card.onclick = () => {
      window.location.href =
        `bird.html?name=${encodeURIComponent(bird.Name)}`;
    };

    grid.appendChild(card);
  });
}

async function addBird() {

  const region = document.getElementById("registerRegion").value;

  const bird = {
    region: region,
    name: document.getElementById("birdName").value,
    size: document.getElementById("birdSize").value,
    color: document.getElementById("birdColor").value,
    egg_size: document.getElementById("birdEggSize").value,
    egg_color: document.getElementById("birdEggColor").value,
    migration_p: document.getElementById("birdMigrationPatterns").value
  };

  if (!bird.name) {
    alert("Name is required.");
    return;
  }

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bird)
  });

  alert("Bird added to database!");
  loadBirds();
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".region-filter").forEach(cb => {
    cb.addEventListener("change", () => {

      const allBirds = document.querySelector('.region-filter[value="All_Birds"]');

      if (cb.value === "All_Birds" && cb.checked) {
        document.querySelectorAll(".region-filter").forEach(other => {
          if (other !== cb) {
            other.checked = false;
          }
        });
      } else if (cb.checked) {
        if (allBirds) {
          allBirds.checked = false;
        }
      }

    });
  });

  const searchInput = document.getElementById("keywordSearch");
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        searchBirds();
      }
    });
  }

  const passwordInput = document.getElementById("password");
  if (passwordInput) {
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        loginUser();
      }
    });
  }

});