/////////////////////////////////////////////
// GLOBAL STATE
/////////////////////////////////////////////

let weights = [];
let meals = [];
let presetMeals = [];
let ingredients = [];
let addToMeal = [];
let macrosHistory = {};
let weightChart = null;
let historyChart = null;
let historyChart2 = null;
let pieChart = null;

/////////////////////////////////////////////
// INITIAL LOAD
/////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", () => {
  weights = loadWeights();
  meals = loadMeals();
  presetMeals = loadPresetMeals();
  ingredients = loadIngredient(); 
  macrosHistory = loadMacrosHistory();

  renderMacrosHistory();
  renderWeights();
  renderMeals();
  renderIngredients(); 
  loadPresetMealsIntoDropdown();
  loadIngredientIntoDropdown(); 
  openMenu();
  updateChart();
  

  document.getElementById("defaultOpen").click();
});

/////////////////////////////////////////////
// WEIGHT TRACKER
/////////////////////////////////////////////

function addWeight() {
  const input = document.getElementById("weightInput");
  const weight = parseFloat(input.value);

  if (isNaN(weight)) return;

  const entry = {
    value: weight,
    date: new Date().toLocaleDateString("en-GB")
  };

  weights.push(entry);

  saveWeights();
  renderWeights();

  input.value = "";
}

function saveWeights() {
  localStorage.setItem("weights", JSON.stringify(weights));
}

function loadWeights() {
  return JSON.parse(localStorage.getItem("weights")) || [];
}

function deleteWeight(index) {
  weights.splice(index, 1);
  saveWeights();
  renderWeights();
}

function deleteInput() {
  weights = [];
  saveWeights();
  renderWeights();
}

function renderWeights() {
  const list = document.getElementById("weightList");
  list.innerHTML = "";

  weights.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.date}: ${item.value} kg
      <button onclick="deleteWeight(${index})">Delete</button>
    `;
    list.appendChild(li);
  });

  updateChart();
}

function updateChart() {
  const canvas = document.getElementById("weightChart");
  if (!canvas) return;

  const labels = weights.map(w => w.date);
  const data = weights.map(w => w.value);

  if (weightChart) weightChart.destroy();

  weightChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Bodyweight (kg)",
          data,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.1)",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/////////////////////////////////////////////
// CALORIES 
/////////////////////////////////////////////

function addMeals() {
  const name = document.getElementById("name").value
  const calories = parseInt(document.getElementById("calories").value);
  const carbs = parseFloat(document.getElementById("carbohydrates").value);
  const fats = parseFloat(document.getElementById("fats").value);
  const proteins = parseFloat(document.getElementById("proteins").value);

  if (
    isNaN(calories) &&
    isNaN(carbs) &&
    isNaN(fats) &&
    isNaN(proteins)
  ) return;

  const meal = {
    name,
    cal: calories || 0,
    carbs: carbs || 0,
    fats: fats || 0,
    proteins: proteins || 0,
    date: new Date().toLocaleDateString("en-GB")
  };

  meals.push(meal);

  saveMeals();
  saveDailyMacros(); // ✅ IMPORTANT FIX
  renderMeals();

  document.getElementById("calories").value = "";
  document.getElementById("carbohydrates").value = "";
  document.getElementById("fats").value = "";
  document.getElementById("proteins").value = "";
}

function saveMeals() {
  const today = new Date().toLocaleDateString("en-GB");

  localStorage.setItem(
    "dailyMeals",
    JSON.stringify({
      date: today,
      meals
    })
  );
}

function loadMeals() {
  const saved = JSON.parse(localStorage.getItem("dailyMeals"));

  if (!saved) return [];

  const today = new Date().toLocaleDateString("en-GB");

  if (saved.date !== today) return [];

  return saved.meals || [];
}

function updateTotal() {
  return meals.reduce(
    (acc, meal) => {
      acc.totalCal += meal.cal || 0;
      acc.totalCarbs += meal.carbs || 0;
      acc.totalFat += meal.fats || 0;
      acc.totalProteins += meal.proteins || 0;
      return acc;
    },
    {
      totalCal: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalProteins: 0
    }
  );
}

function renderMeals() {
  const list = document.getElementById("macroslist");
  list.innerHTML = "";

  meals.forEach((meal, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      Meal ${index + 1}
      [${meal.name}]:
      ${meal.cal.toFixed(1)} kcal, 
      ${meal.carbs.toFixed(1)}g carbs, 
      ${meal.fats.toFixed(1)}g fat, 
      ${meal.proteins.toFixed(1)}g protein
      <button onclick="deleteMeal(${index})">Delete</button>
    `;

    list.appendChild(li);
  });

  const totals = updateTotal();
  updatePieChart();

  const totalLi = document.createElement("li");
  totalLi.innerHTML = `
    <strong>
      Total: ${totals.totalCal.toFixed(1)} kcal | 
      ${totals.totalCarbs.toFixed(1)}g carbs | 
      ${totals.totalFat.toFixed(1)}g fat | 
      ${totals.totalProteins.toFixed(1)}g protein
    </strong>
  `;

  list.appendChild(totalLi);
}

function deleteMeal(index) {
  meals.splice(index, 1);
  saveMeals();
  saveDailyMacros(); // ✅ IMPORTANT FIX
  renderMeals();
}

function saveDailyMacros() {
  const today = new Date().toISOString().split("T")[0];

  const totals = updateTotal();

  macrosHistory = JSON.parse(localStorage.getItem("macrosHistory")) || {};

  macrosHistory[today] = {
    cal: totals.totalCal,
    carbs: totals.totalCarbs,
    fats: totals.totalFat,
    protein: totals.totalProteins
  };

  localStorage.setItem("macrosHistory", JSON.stringify(macrosHistory));

  renderMacrosHistory(); // ✅ keep UI synced
}

function loadMacrosHistory() {
  return JSON.parse(localStorage.getItem("macrosHistory")) || {};
}

function updatePieChart() {
  const canvas = document.getElementById("pieChart");
  if (!canvas) return;

  const totals = updateTotal();

  // const carbs = totals.map(w => w.totalCarbs);
  // const fats = totals.map(w => w.totalFat);
  // const protein = totals.map(w=>w.totalProteins);
  const barColors = [
  "rgba(255,0,0,1.0)",
  "rgba(0,255,0,0.8)",
  "rgba(0,0,255,0.6)",
  ];

  if (pieChart) pieChart.destroy();

  const xValues = ["Carbs","Fats","Protein"];
  const totalcal = totals.totalCarbs*4 + totals.totalFat*9 + totals.totalProteins*4;
  const yValues = [
    (totals.totalCarbs*4/totalcal)*100,
    (totals.totalFat*9/totalcal)*100,
    (totals.totalProteins*4/totalcal)*100
  ];

  pieChart = new Chart(canvas, {
    type: "pie",
    data: {
    labels: xValues,
    datasets: [{
      backgroundColor: barColors,
      data: yValues
    }]
  },
    options: {
    title: {
    display: true,
    text: "Daily Calories Distribution"
    }
  }
});
}
/////////////////////////////////////////////
// PRESET MEALS
/////////////////////////////////////////////

function submitForm() {
  const mealname = document.getElementById("mealname").value;
  const calories = parseInt(document.getElementById("newcal").value);
  const carbs = parseFloat(document.getElementById("newcarbs").value);
  const fats = parseFloat(document.getElementById("newfat").value);
  const protein = parseFloat(document.getElementById("newprotein").value);

  const preset = {
    mealname,
    calories: calories || 0,
    carbohydrates: carbs || 0,
    fats: fats || 0,
    protein: protein || 0
  };

  presetMeals.push(preset);

  savePresetMeals();
  loadPresetMealsIntoDropdown();

  alert("Preset meal saved!");
}

function savePresetMeals() {
  localStorage.setItem("presetMeals", JSON.stringify(presetMeals));
}

function loadPresetMeals() {
  return JSON.parse(localStorage.getItem("presetMeals")) || [];
}

function loadPresetMealsIntoDropdown() {
  const select = document.getElementById("mealSelect");
  select.innerHTML = `<option value="">Select a meal</option>`;

  presetMeals.forEach((meal, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = meal.mealname;
    select.appendChild(option);
  });
}

function selectPresetMeal() {
  const index = document.getElementById("mealSelect").value;
  if (index === "") return;

  const meal = presetMeals[parseInt(index)];

  document.getElementById("calories").value = meal.calories;
  document.getElementById("carbohydrates").value = meal.carbohydrates;
  document.getElementById("fats").value = meal.fats;
  document.getElementById("proteins").value = meal.protein;
}

function deletePresetMeal() {
  const select = document.getElementById("mealSelect");
  const index = select.value;

  if (index === "") {
    alert("Please select a meal to delete.");
    return;
  }

  // Remove from array
  presetMeals.splice(parseInt(index), 1);

  // Save updated list
  savePresetMeals();

  // Refresh dropdown + clear inputs
  loadPresetMealsIntoDropdown();
  select.value = "";

  document.getElementById("calories").value = "";
  document.getElementById("carbohydrates").value = "";
  document.getElementById("fats").value = "";
  document.getElementById("proteins").value = "";

  alert("Preset meal deleted.");
}

/////////////////////////////////////////////
// ADD INGREDIENTS TO CONSTRUCT MEALS (POPUP WINDOW)
/////////////////////////////////////////////

function addIngredients(){
  const index = document.getElementById("ingredientSelect").value;
  if (index === "") return;

  const ing = ingredients[parseInt(index)];

  amount = parseInt(document.getElementById("amount").value);
  component = {
    ingredient: ing.ingredient,
    cal: ing.ing_calories,
    carbs: ing.ing_carbohydrates,
    fats: ing.ing_fats,
    protein: ing.ing_protein,
    amount: amount
  }

  addToMeal.push(component);
  renderComponents();
}

function renderComponents() {
  const list = document.getElementById("ingy_list");
  list.innerHTML = "";

  addToMeal.forEach((component, index) => {
    const li = document.createElement("li");

    li.innerHTML = ` 
      ${component.ingredient}
      (${component.amount}g) 
    `;

    list.appendChild(li);
  });
}

function constructMeal(){

  const mealname = document.getElementById("newmealname").value;

  let cal = 0;
  let carb = 0;
  let fat = 0;
  let protein = 0;

  addToMeal.forEach((component) =>{
    cal += component.cal * component.amount / 100; 
    carb += component.carbs * component.amount / 100;
    fat += component.fats * component.amount / 100;
    protein += component.protein * component.amount / 100;
  });

  const preset = {
    mealname,
    calories: cal || 0,
    carbohydrates: carb || 0,
    fats: fat || 0,
    protein: protein || 0,

    // ✅ NEW: store ingredient breakdown
    components: [...addToMeal] 
  };

  presetMeals.push(preset);

  savePresetMeals();
  loadPresetMealsIntoDropdown();

  alert("Preset meal saved!");

  // Reset
  addToMeal = [];
  renderComponents();
  document.getElementById("amount").value = "";
}

/////////////////////////////////////////////
// INGREDIENTS
/////////////////////////////////////////////

function submitIngredient() {
  const ingredient = document.getElementById("ingredient").value;
  const ing_calories = parseInt(document.getElementById("ingcal").value);
  const ing_carbs = parseFloat(document.getElementById("ingcarb").value);
  const ing_fats = parseFloat(document.getElementById("ingfat").value);
  const ing_protein = parseFloat(document.getElementById("ingprotein").value);

  const ing_macros = {
    ingredient,
    ing_calories: ing_calories || 0,
    ing_carbohydrates: ing_carbs || 0,
    ing_fats: ing_fats || 0,
    ing_protein: ing_protein || 0
  };

  ingredients.push(ing_macros);

  saveIngredient();
  loadIngredientIntoDropdown();
  renderIngredients();

  alert("Ingredient saved!");
  document.getElementById("ingredient").value = ""
  document.getElementById("ingcal").value = ""
  document.getElementById("ingcarb").value = ""
  document.getElementById("ingfat").value = ""
  document.getElementById("ingprotein").value = ""
}

function saveIngredient() {
  localStorage.setItem("ingredients", JSON.stringify(ingredients));
}

function loadIngredient() {
  return JSON.parse(localStorage.getItem("ingredients")) || [];
}

function loadIngredientIntoDropdown() {
  const select = document.getElementById("ingredientSelect");
  select.innerHTML = `<option value="">Select an ingredient</option>`;

  ingredients.forEach((ing, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = ing.ingredient;
    select.appendChild(option);
  });
}

function renderIngredients() {
  const tableBody = document.querySelector("#ingredientTable tbody");
  tableBody.innerHTML = "";

  // Create a sorted copy (A → Z)
  const sortedIngredients = [...ingredients].sort((a, b) =>
    a.ingredient.localeCompare(b.ingredient)
  );

  sortedIngredients.forEach((ing, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ing.ingredient}</td>
      <td>${ing.ing_calories.toFixed(1)}</td>
      <td>${ing.ing_carbohydrates.toFixed(1)}</td>
      <td>${ing.ing_fats.toFixed(1)}</td>
      <td>${ing.ing_protein.toFixed(1)}</td>
      <td>
        <button onclick="deleteIngredient(${ingredients.indexOf(ing)})">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

function deleteIngredient(index) {
  ingredients.splice(index, 1);
  saveIngredient();
  renderIngredients();
  loadIngredientIntoDropdown();
}

/////////////////////////////////////////////
// MEALS
/////////////////////////////////////////////

function openMenu() {
  const select = document.getElementById("menu");
  select.innerHTML = `<option value="">Select a meal</option>`;

  presetMeals.forEach((meal, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = meal.mealname;
    select.appendChild(option);
  });
}


function renderSelectedMeal() {
  const index = document.getElementById("menu").value;
  const container = document.getElementById("mealViewer");

  container.innerHTML = "";

  if (index === "") return;

  const meal = presetMeals[parseInt(index)];

  let componentsHTML = "";

  if (meal.components && meal.components.length > 0) {
    componentsHTML = `
      <h3>Ingredients</h3>
      <ul>
        ${meal.components.map(c => `
          <li>
            ${c.ingredient} — ${c.amount}g
          </li>
        `).join("")}
      </ul>
    `;
  }

  container.innerHTML = `
    <h2>${meal.mealname}</h2>

    <p><strong>Calories:</strong> ${meal.calories.toFixed(1)}</p>
    <p><strong>Carbs:</strong> ${meal.carbohydrates.toFixed(1)}g</p>
    <p><strong>Fats:</strong> ${meal.fats.toFixed(1)}g</p>
    <p><strong>Protein:</strong> ${meal.protein.toFixed(1)}g</p>

    ${componentsHTML}
  `;
}

/////////////////////////////////////////////
// HISTORY
/////////////////////////////////////////////

function renderMacrosHistory() {
  const list = document.getElementById("macroHistoryList");
  if (!list) return;

  list.innerHTML = "";

  const entries = Object.entries(macrosHistory);

  // optional: sort by date
  entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));

  entries.forEach(([date, data]) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${date}</strong> — 
      ${data.cal.toFixed(0)} kcal | 
      ${data.carbs.toFixed(0)}g carbs | 
      ${data.fats.toFixed(0)}g fat | 
      ${data.protein.toFixed(0)}g protein
    `;

    list.appendChild(li);
  });
  updatehistoryChart();
}

function updatehistoryChart() {
  const canvas = document.getElementById("historyChart");
  if (!canvas) return;

  const canvas2 = document.getElementById("historyChart2");
  if (!canvas2) return;

  const entries = Object.entries(macrosHistory);

  if (entries.length === 0) return;

  // sort by date
  entries.sort((a, b) => new Date(a[0]) - new Date(b[0]));

  const labels = entries.map(([date]) => date);
  const calories = entries.map(([_, data]) => data.cal);

  const carbs = entries.map(([_, data]) => data.carbs);
  const fats = entries.map(([_, data]) => data.fats);
  const protein = entries.map(([_, data]) => data.protein);

  if (historyChart) historyChart.destroy();
  if (historyChart2) historyChart2.destroy();

  historyChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label:"calories",
          data: calories,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.1)",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  historyChart2 = new Chart(canvas2, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label:"carbs",
          data: carbs,
          borderColor: "red",
          fill: false
        },{
          label:"fats",
          data: fats,
          borderColor: "green",
          fill: false
        },{
          label:"protein",
          data: protein,
          borderColor: "blue",
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

/////////////////////////////////////////////
// UI HELPERS
/////////////////////////////////////////////

function openPopup() {
  document.getElementById("popup").style.display = "block";
}

function closePopup() {
  document.getElementById("popup").style.display = "none";
}

function openPopupIng() {
  document.getElementById("popup_ing").style.display = "block";
}

function closePopupIng() {
  document.getElementById("popup_ing").style.display = "none";
}

function openPage(pageName, elmnt, color) {
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  const tablinks = document.getElementsByClassName("tablink");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].style.backgroundColor = "";
  }

  document.getElementById(pageName).style.display = "block";
  elmnt.style.backgroundColor = color;
}

function goHome() {
  document.getElementById("homeTab").click();
}