// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } 
  from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } 
  from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// Your Firebase Config (replace this with yours)
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
const storage = getStorage(app);

// DOM elements
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const imageFile = document.getElementById("imageFile");
const addBtn = document.getElementById("addProductBtn");
const productList = document.getElementById("productList");

// Add product to Firebase (Storage + Firestore)
addBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const file = imageFile.files[0];

  if (!name || !price || !file) {
    alert("Please fill all fields and select an image!");
    return;
  }

  try {
    // 1️⃣ Upload image to Firebase Storage
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);

    // 2️⃣ Get the download URL
    const imageURL = await getDownloadURL(storageRef);

    // 3️⃣ Save product info to Firestore
    await addDoc(collection(db, "products"), {
      name,
      price,
      image: imageURL
    });

    alert("✅ Product added successfully!");
    nameInput.value = "";
    priceInput.value = "";
    imageFile.value = "";

    loadProducts();
  } catch (error) {
    console.error("Error adding product:", error);
    alert("❌ Failed to add product!");
  }
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
      <img src="${product.image}" alt="${product.name}" width="150">
      <h4>${product.name}</h4>
      <p>₹${product.price}</p>
    `;
    productList.appendChild(div);
  });
}

// Load products when page opens
loadProducts();
