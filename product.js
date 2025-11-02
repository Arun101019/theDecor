// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } 
  from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Your Firebase config (replace this with your own from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDRVCbBDzuqIG2mYBLDrReunh4oLJa5WK",
  authDomain: "thedecor-6d3f4.firebaseapp.com",
  projectId: "thedecor-6d3f4",
  storageBucket: "thedecor-6d3f4.appspot.com",
  messagingSenderId: "993017983175",
  appId: "1:993017983175:web:xxxxxxx"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const imageInput = document.getElementById("image");
const addBtn = document.getElementById("addProductBtn");
const productList = document.getElementById("productList");

// Add product to Firestore
addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const image = imageInput.value.trim();

  if (!name || !price || !image) {
    alert("Please fill all fields!");
    return;
  }

  await addDoc(collection(db, "products"), { name, price, image });
  alert("✅ Product added!");
  nameInput.value = "";
  priceInput.value = "";
  imageInput.value = "";
  loadProducts();
});

// Load all products from Firestore
async function loadProducts() {
  productList.innerHTML = "Loading products...";
  const querySnapshot = await getDocs(collection(db, "products"));
  productList.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const div = document.createElement("div");
    div.classList.add("product-card");
    div.innerHTML = `
      <h4>${product.name}</h4>
      <img src="${product.image}" alt="${product.name}" width="150">
      <p>Price: ₹${product.price}</p>
    `;
    productList.appendChild(div);
  });
}

// Load products on page load
loadProducts();
