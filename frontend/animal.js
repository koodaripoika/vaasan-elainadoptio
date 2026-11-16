// Eläimen oma sivu: näyttää kaikki tiedot ja adoptiolomakkeen

// id tulee osoitteesta, esim animal.html?id=3
const params = new URLSearchParams(window.location.search);
const animalId = params.get("id");

const statusText = document.getElementById("status-text");
const form = document.getElementById("adopt-form");
const formError = document.getElementById("form-error");
const submitButton = document.getElementById("submit-button");

async function loadAnimal() {
  if (!animalId) {
    statusText.textContent = "Eläintä ei ole valittu.";
    return;
  }

  try {
    const response = await fetch(API_URL + "/animals/" + animalId);

    if (response.status === 404) {
      statusText.textContent = "Eläintä ei löytynyt.";
      return;
    }

    if (!response.ok) {
      throw new Error("Palvelin vastasi koodilla " + response.status);
    }

    const animal = await response.json();
    showAnimal(animal);
  } catch (err) {
    console.error(err);
    statusText.textContent = "Tietojen lataus epäonnistui. Onhan palvelin päällä?";
  }
}

function showAnimal(animal) {
  document.title = animal.name + " - Vaasan Eläinsuoja";
  statusText.textContent = "";

  const image = document.getElementById("animal-image");
  image.src = imageSrc(animal);
  image.alt = animal.name;
  // sama juttu kuin etusivulla, rikkinäisen kuvan tilalle placeholder
  image.onerror = function () {
    image.onerror = null;
    image.src = "placeholder.svg";
  };

  // textContent eikä innerHTML, niin tekstit näkyy just sellaisenaan
  document.getElementById("animal-name").textContent = animal.name;
  document.getElementById("animal-type").textContent = typeText(animal.type);
  document.getElementById("animal-age").textContent = ageText(animal.age);
  document.getElementById("animal-breed").textContent = animal.breed || "Ei tiedossa";
  document.getElementById("animal-description").textContent = animal.description || "";
  document.getElementById("form-animal-name").textContent = animal.name;

  document.getElementById("animal-details").classList.remove("hidden");

  // adoptoidulle eläimelle ei näytetä lomaketta ollenkaan
  if (animal.status === "adopted") {
    document.getElementById("adopted-badge").classList.remove("hidden");
    document.getElementById("adopted-notice").classList.remove("hidden");
  } else {
    document.getElementById("adopt-section").classList.remove("hidden");
  }
}

form.addEventListener("submit", async function (event) {
  // ilman tätä selain lähettäisi lomakkeen itse ja lataisi sivun uudestaan
  event.preventDefault();

  formError.textContent = "";
  submitButton.disabled = true;
  submitButton.textContent = "Lähetetään...";

  const application = {
    applicant_name: form.applicant_name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    message: form.message.value.trim(),
  };

  try {
    const response = await fetch(API_URL + "/animals/" + animalId + "/adopt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(application),
    });

    const data = await response.json();

    if (response.ok) {
      // hakemus on nyt tallennettu kantaan, joten siirrytään kiitos-sivulle.
      // eläimen nimi viedään mukana osoitteessa
      window.location.href = "kiitos.html?nimi=" + encodeURIComponent(data.animal_name);
      return;
    }

    // palvelin palauttaa virheestä selkeän tekstin, näytetään se käyttäjälle
    formError.textContent = data.error || "Jokin meni pieleen, yritä uudelleen.";
  } catch (err) {
    console.error(err);
    formError.textContent = "Hakemuksen lähetys epäonnistui. Yritä hetken päästä uudelleen.";
  }

  submitButton.disabled = false;
  submitButton.textContent = "Adoptoi minut";
});

loadAnimal();
