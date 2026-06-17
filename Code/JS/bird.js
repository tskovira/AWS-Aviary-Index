const API_URL = "https://ytmvuortakcquzqnpzn6vckwma0fbdbx.lambda-url.us-east-2.on.aws/";

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    name: params.get("name"),
    region: params.get("region")
  };
}

async function loadBirdDetails() {
  const { name, region } = getParams();

  const res = await fetch(
    `${API_URL}?search=${encodeURIComponent(name)}&exact=true`
  );
  const data = await res.json();

  const bird = data[0];

  if (!bird) {
    document.body.innerHTML = "<h2>Bird not found</h2>";
    return;
  }

  document.getElementById("birdName").textContent = bird.Name;
  document.getElementById("birdSubtitle").textContent = bird.region || "";

  document.getElementById("birdSize").textContent = bird.Size ?? "";
  document.getElementById("birdColor").textContent = bird.color ?? "";
  document.getElementById("birdEggSize").textContent = bird.egg_size ?? "";
  document.getElementById("birdEggColor").textContent = bird.egg_color ?? "";
  document.getElementById("birdMigration").textContent = bird.migration_p ?? "";
  document.getElementById("birdDescription").textContent =bird.Description ?? "No description available.";
  document.getElementById("birdSpeciesStatus").textContent = bird.Species_Status ?? "";

  const img = document.getElementById("birdImage");

  const baseURL = "http://aviary-index.s3-website.us-east-2.amazonaws.com/Birds_Images/Birds_Images/";

  const hero = document.querySelector(".hero");

  hero.style.backgroundImage = `url(${img.src})`;

  const migrationImage = document.getElementById("migrationImage");

  const baseMigrationURL = "https://aviary-index.s3.us-east-2.amazonaws.com/Migration_Pattern/Migration_Pattern/";

  const attempts = [
    bird.Name, 
    bird.Name.replace(/\s+/g, "_"), 
    bird.Name.replace(/\s+/g, "-"), 
    bird.Name.toLowerCase().replace(/\s+/g, "_"), 
    bird.Name.toLowerCase().replace(/\s+/g, "-"), 
    bird.Name.replace(/-/g, "_"),
    bird.Name.toLowerCase().replace(/-/g, "_"),
  ];

  let attemptIndex = 0;

  function tryNextImage() {
    if (attemptIndex >= attempts.length) {
      img.src = baseURL + "default.png";
      return;
    }

    img.src = baseURL + attempts[attemptIndex] + ".png";
    attemptIndex++;
  }

  img.onerror = tryNextImage;

  migrationImage.onerror = function () {
    this.style.display = "none";
  };

  tryNextImage();

  const migrationAttempts = [
    bird.Name,
    bird.Name.replace(/\s+/g, "_"),
    bird.Name.replace(/\s+/g, "-"),
    bird.Name.toLowerCase().replace(/\s+/g, "_"),
    bird.Name.toLowerCase().replace(/\s+/g, "-"),
    bird.Name.replace(/-/g, "_"),
    bird.Name.toLowerCase().replace(/-/g, "_"),
  ];
  
  let migrationIndex = 0;
  
  function tryNextMigrationImage() {
    if (migrationIndex >= migrationAttempts.length) {
      migrationImage.style.display = "none";
      return;
    }
  
    migrationImage.src = baseMigrationURL + migrationAttempts[migrationIndex] + ".png";
    migrationIndex++;
  }
  
  migrationImage.onerror = tryNextMigrationImage;
  
  tryNextMigrationImage();

}

function goBack() {
  window.history.back();
}

loadBirdDetails();