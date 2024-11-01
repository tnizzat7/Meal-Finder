async function searchMeal() {
    const query = document.getElementById('search-input').value.trim();
    const searchType = document.querySelector('input[name="search-type"]:checked').value;
    let url = '';

    if (searchType === 'meal') {
        url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`;
    } else if (searchType === 'ingredient') {
        url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${query}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (searchType === 'meal' && data.meals) {
        displayMeals(data.meals);
    } else if (searchType === 'ingredient' && data.meals) {
        const mealDetailsPromises = data.meals.map(meal => fetchMealDetails(meal.idMeal));
        const mealsDetails = await Promise.all(mealDetailsPromises);
        displayMeals(mealsDetails);
    } else {
        document.getElementById('meal-info').innerHTML = "<p>No meals found.</p>";
    }
}
// to fetch data
async function fetchMealDetails(mealId) {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
    const data = await response.json();
    return data.meals[0];
}

function displayMeals(meals) {
    const mealInfoDiv = document.getElementById('meal-info');
    mealInfoDiv.innerHTML = '';

    meals.forEach((meal) => {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`] && meal[`strMeasure${i}`]) {
                ingredients.push({
                    ingredient: meal[`strIngredient${i}`],
                    measure: meal[`strMeasure${i}`]
                });
            }
        }

        const mealCard = document.createElement('div');
        mealCard.classList.add('meal-card');
        mealCard.innerHTML = `
            <div class="meal-image-container">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            </div>
            <div class="meal-content">
                <h3 class="meal-title">${meal.strMeal}</h3>
                <div class="meal-badge">
                    ${meal.strCategory || 'Main Course'}
                </div>
                <div class="ingredients-preview">
                    <h4>Main Ingredients:</h4>
                    <ul>
                        ${ingredients.slice(0, 3).map(ing => 
                            `<li>${ing.measure} ${ing.ingredient}</li>`
                        ).join('')}
                    </ul>
                </div>
                <div class="meal-actions">
                    <button onclick="addToPlanner('${meal.strMeal}')"
                        class="btn-add">Add to Planner</button>
                    <a href="${meal.strYoutube}" target="_blank" class="btn-youtube">Watch</a>
                </div>
            </div>
        `;

        mealInfoDiv.appendChild(mealCard);
    });
}

// Data Management and Main Application Logic
const MealPlannerDB = {
    meals: [],
    groceries: [],

    init() {
        this.meals = JSON.parse(localStorage.getItem('mealPlanner')) || [];
        this.groceries = JSON.parse(localStorage.getItem('groceryList')) || [];
        this.render();
    },

    save() {
        localStorage.setItem('mealPlanner', JSON.stringify(this.meals));
        localStorage.setItem('groceryList', JSON.stringify(this.groceries));
    },

    // CRUD process
    addMeal(meal) {
        const newMeal = {
            id: Date.now(),
            name: meal,
            date: new Date().toISOString().split('T')[0],
            notes: '',
            completed: false
        };
        this.meals.push(newMeal);
        this.save();
        this.renderMealList();
        
    },

    deleteMeal(id) {
        this.meals = this.meals.filter(meal => meal.id !== id);
        this.save();
        this.renderMealList();
        
    },

    // CRUD Operations for Groceries
    addGrocery(item) {
        const newItem = {
            id: Date.now(),
            name: item,
            quantity: 1,
            completed: false
        };
        this.groceries.push(newItem);
        this.save();
        this.renderGroceryList();
        
    },

    deleteGrocery(id) {
        this.groceries = this.groceries.filter(item => item.id !== id);
        this.save();
        this.renderGroceryList();
        
    },

    editGroceryItem(index) {
        // Display input field and Save button, to hide the text and edit button
        const groceryItem = this.groceries[index];
        const inputField = document.getElementById(`edit-input-${index}`);
        const itemText = document.getElementById(`item-text-${index}`);

        itemText.style.display = 'none';
        inputField.style.display = 'inline';
        inputField.value = groceryItem.name; // Pre-fill input with current item name
        document.querySelectorAll('.save-btn')[index].style.display = 'inline';
        document.querySelectorAll('.edit-btn')[index].style.display = 'none';
    },

    saveGroceryItem(index) {
        const newValue = document.getElementById(`edit-input-${index}`).value.trim();
        if (newValue !== '') {
            this.groceries[index].name = newValue; // Update the item with the new value
            this.save(); // Save the updated list
            this.renderGroceryList(); // Refresh the displayed list to apply changes
        } else {
            alert('Item cannot be empty!');
        }
    },

    render() {
        this.renderMealList();
        this.renderGroceryList();
    },

    renderMealList() {
        const mealPlannerList = document.getElementById('meal-planner-list');
        mealPlannerList.innerHTML = ''; // Clear existing meals

        this.meals.forEach(meal => {
            const mealItem = document.createElement('div');
            mealItem.classList.add('meal-item');
            mealItem.innerHTML = `
                <span>${meal.name} - ${meal.date}</span>
                <button onclick="MealPlannerDB.deleteMeal(${meal.id})">Delete</button>
            `;
            mealPlannerList.appendChild(mealItem);
        });
    },

    renderGroceryList() {
        const groceryListContainer = document.getElementById('grocery-list');
        groceryListContainer.innerHTML = ''; // Clear existing items

        this.groceries.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('grocery-item');
            itemElement.innerHTML = `
                <p id="item-text-${index}">${item.name}</p>
                <input type="text" id="edit-input-${index}" class="edit-input" value="${item.name}" style="display:none;">
                <div class="item-buttons">
                    <button class="edit-btn" onclick="MealPlannerDB.editGroceryItem(${index})">Edit</button>
                    <button class="save-btn" onclick="MealPlannerDB.saveGroceryItem(${index})" style="display:none;">Save</button>
                    <button class="remove-btn" onclick="MealPlannerDB.deleteGrocery(${item.id})">Remove</button>
                </div>
            `;
            groceryListContainer.appendChild(itemElement);
        });
    }
}


// Helper Functions
function showPage(page) {
    const pages = ['home', 'planner'];
    pages.forEach(p => document.getElementById(p).classList.add('hidden'));
    document.getElementById(page).classList.remove('hidden');
}

// Initialize page visibility and database on load
document.addEventListener('DOMContentLoaded', () => {
    showPage('home');
    MealPlannerDB.init();
});

function addToPlanner(mealName) {
    MealPlannerDB.addMeal(mealName);
}

function addMeal() {
    const mealInput = document.getElementById('meal-planner').value.trim();
    if (mealInput) {
        MealPlannerDB.addMeal(mealInput);
        document.getElementById('meal-planner').value = ''; // Clear input
    } else {
        alert('Please enter a meal name!');
    }
}

function addGrocery() {
    const groceryInput = document.getElementById('grocery-item').value.trim();
    if (groceryInput) {
        MealPlannerDB.addGrocery(groceryInput);
        document.getElementById('grocery-item').value = ''; // Clear input
    } else {
        alert('Please enter a grocery item!');
    }
}

function showEditForm(id) {
    // Show the edit form for a specific grocery item
    document.getElementById(`edit-form-${id}`).classList.remove('hidden');
}

function cancelEdit(id) {
    // Hide the edit form without saving changes
    document.getElementById(`edit-form-${id}`).classList.add('hidden');
}

function saveGroceryEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value.trim();
    const newQuantity = parseInt(document.getElementById(`edit-quantity-${id}`).value.trim());

    if (newName && newQuantity) {
        MealPlannerDB.updateGrocery(id, newName, newQuantity);
    } else {
        alert("Please enter valid values for name and quantity.");
    }

    cancelEdit(id); // Hide the edit form after saving
}

function saveToFile() {
    const mealsText = MealPlannerDB.meals.map(meal => `${meal.name} - ${meal.date}`).join('\n');
    const groceriesText = MealPlannerDB.groceries.map(item => `${item.name}`).join('\n');

    const content = `Meals:\n${mealsText}\n\nGrocery List:\n${groceriesText}`;
    
    // Create a Blob and generate a URL for it
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download the file
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal_planner.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up the URL
}



