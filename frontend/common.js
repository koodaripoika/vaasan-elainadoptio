// Yhteiset jutut kaikille sivuille

// Server A:n osoite. Selain ajetaan omalla koneella, joten tässä on localhost
// eikä Docker-verkon nimi (server-a), jota selain ei tunne
const API_URL = "http://localhost:3001";

// muuttaa iän tekstiksi, esim 1 -> "1 vuosi" ja 3 -> "3 vuotta"
function ageText(age) {
  if (age === null || age === undefined) {
    return "Ikä ei tiedossa";
  }
  if (age === 1) {
    return "1 vuosi";
  }
  return age + " vuotta";
}

// kannassa tyyppi on pienellä (kissa), sivulla isolla alkukirjaimella (Kissa)
function typeText(type) {
  if (!type) {
    return "";
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// tykkäysten määrä tekstinä, sama taivutusjuttu kuin iässä
function likesText(likes) {
  if (!likes) {
    return "Ei vielä tykkäyksiä";
  }
  if (likes === 1) {
    return "1 tykkäys";
  }
  return likes + " tykkäystä";
}

// jos eläimellä ei ole kuvaa, käytetään placeholderia
function imageSrc(animal) {
  if (animal.image_url) {
    return animal.image_url;
  }
  return "placeholder.svg";
}
