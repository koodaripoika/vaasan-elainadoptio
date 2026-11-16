// Etusivu: haetaan kaikki eläimet Server A:lta ja tehdään niistä kortit

const animalList = document.getElementById("animal-list");
const statusText = document.getElementById("status-text");

async function loadAnimals() {
  try {
    const response = await fetch(API_URL + "/animals");

    if (!response.ok) {
      throw new Error("Palvelin vastasi koodilla " + response.status);
    }

    const animals = await response.json();
    showAnimals(animals);
  } catch (err) {
    console.error(err);
    statusText.textContent = "Eläinten lataus epäonnistui. Onhan palvelin päällä?";
  }
}

function showAnimals(animals) {
  animalList.innerHTML = "";

  if (animals.length === 0) {
    statusText.textContent = "Tällä hetkellä ei ole adoptoitavia eläimiä.";
    return;
  }

  statusText.textContent = "";

  for (const animal of animals) {
    const card = document.createElement("article");
    card.className = "card";

    let adoptedBadge = "";
    if (animal.status === "adopted") {
      card.classList.add("adopted");
      adoptedBadge = '<span class="badge-adopted">Adoptoitu</span>';
    }

    // onerror vaihtaa placeholderin jos kuvan linkki on rikki.
    // onerror = null estää ikuisen loopin jos placeholderkin puuttuisi
    card.innerHTML = `
      <div class="card-image">
        <img src="${imageSrc(animal)}" alt="${animal.name}" onerror="this.onerror = null; this.src = 'placeholder.svg';">
        ${adoptedBadge}
      </div>
      <div class="card-body">
        <h2>${animal.name}</h2>
        <p class="card-info">${typeText(animal.type)}, ${ageText(animal.age)}</p>
        <a class="button" href="animal.html?id=${animal.id}">Katso lisää</a>
      </div>
    `;

    animalList.appendChild(card);
  }
}

loadAnimals();
