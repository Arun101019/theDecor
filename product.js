// product.js - improved with debugging and quota handling

let products = JSON.parse(localStorage.getItem("products")) || [];

/** Save to localStorage with quota detection */
function saveProducts() {
  try {
    localStorage.setItem("products", JSON.stringify(products));
    console.log("Products saved. current count:", products.length);
  } catch (err) {
    console.error("Error saving to localStorage:", err);
    // detect quota exceeded (different browsers give different error types/messages)
    if (err && (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || /quota/i.test(err.message))) {
      throw new Error("localStorage quota exceeded. Try smaller images or fewer products.");
    } else {
      throw err;
    }
  }
}

/** Convert image file to Base64 (with size/type checks) */
function readImageFile(file) {
  const MAX_FILE_BYTES = 1024 * 1024 * 2; // 2 MB per file limit (adjustable)
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Selected file is not an image: " + file.name));
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      // reject if too large — avoids blowing localStorage
      reject(new Error(`File too large: ${file.name} (${Math.round(file.size/1024)} KB). Max ${Math.round(MAX_FILE_BYTES/1024)} KB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = (e) => {
      reject(new Error("FileReader error for " + file.name));
    };
    reader.readAsDataURL(file);
  });
}

/** Estimate bytes a base64 string will use in storage */
function estimateBase64Bytes(base64) {
  if (!base64) return 0;
  // Remove data URL prefix if present
  const commaIndex = base64.indexOf(",");
  const actual = commaIndex >= 0 ? base64.slice(commaIndex + 1) : base64;
  // Base64 length to bytes: (4/3) base64 chars -> bytes so bytes ~= base64Length * 3/4
  return Math.round((actual.length * 3) / 4);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("product.js DOMContentLoaded");

  const productForm = document.getElementById("productForm");
  const productList = document.getElementById("productList");

  if (productForm) {
    console.log("Admin page: form found, attaching submit handler.");

    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const name = document.getElementById("pname").value.trim();
        const price = document.getElementById("pprice").value.trim();
        const desc = document.getElementById("pdesc").value.trim();
        const mainFile = document.getElementById("mainImgFile").files[0];
        const otherFiles = Array.from(document.getElementById("otherImgsFile").files || []);

        if (!name || !price || !mainFile) {
          alert("⚠️ Name, Price, and Main Image are required.");
          return;
        }

        console.log("Reading main image:", mainFile && mainFile.name);
        const mainImage = await readImageFile(mainFile);

        console.log("Reading other images count:", otherFiles.length);
        const otherImages = [];
        for (const f of otherFiles) {
          try {
            const data = await readImageFile(f);
            otherImages.push(data);
          } catch (fileErr) {
            // skip problematic file but inform admin
            console.warn("Skipping file", f.name, fileErr.message);
            alert(`⚠️ Skipped "${f.name}": ${fileErr.message}`);
          }
        }

        // Quick size estimate before saving
        let totalBytes = 0;
        totalBytes += estimateBase64Bytes(mainImage);
        otherImages.forEach(b64 => totalBytes += estimateBase64Bytes(b64));
        console.log("Estimated bytes for new product images:", totalBytes);

        // Optional: Prevent saving if estimated product images > 4.5MB (approx localStorage safe margin)
        const SAFETY_LIMIT = 1024 * 1024 * 4.5; // ~4.5 MB
        if (totalBytes > SAFETY_LIMIT) {
          alert("❌ Selected images are too large combined (~" + Math.round(totalBytes/1024) + " KB). Reduce image sizes.");
          return;
        }

        const product = { name, price, desc, mainImage, otherImages };
        products.push(product);

        try {
          saveProducts();
        } catch (storageErr) {
          // If quota error, pop last product and show message
          products.pop();
          throw storageErr;
        }

        alert("✅ Product added successfully!");
        e.target.reset();

        // If on admin page and you want preview update, you can reload or update UI
        // location.reload(); // optional: uncomment to reflect changes immediately
      } catch (err) {
        console.error("Error in submit handler:", err);
        // Show friendly message but include err.message so you can see cause
        alert("❌ Something went wrong while adding product.\n\nDetails: " + (err.message || err));
      }
    });
  }

  // Customer view: render products
  if (productList) {
    console.log("Customer page: rendering", products.length, "products.");
    productList.innerHTML = "";
    products.forEach((p, i) => {
      const col = document.createElement("div");
      col.className = "col-md-4";
      col.innerHTML = `
        <div class="card h-100 bg-secondary text-light shadow">
          <img src="${p.mainImage}" class="card-img-top" alt="${p.name}">
          <div class="card-body">
            <h5>${p.name}</h5>
            <p class="text-success fw-bold">₹${p.price}</p>
            <button class="btn btn-light btn-sm" onclick="showProduct(${i})">View Details</button>
          </div>
        </div>
      `;
      productList.appendChild(col);
    });
  }
});

/** Modal function (unchanged) */
function showProduct(index) {
  const p = products[index];
  if (!p) return;
  document.getElementById("modalTitle").textContent = p.name;
  document.getElementById("mainImage").src = p.mainImage;
  document.getElementById("modalDesc").textContent = p.desc;
  document.getElementById("modalPrice").textContent = "₹" + p.price;

  const imgDiv = document.getElementById("otherImages");
  imgDiv.innerHTML = "";
  (p.otherImages || []).forEach(img => {
    const i = document.createElement("img");
    i.src = img;
    i.className = "thumb-img";
    i.onclick = () => (document.getElementById("mainImage").src = img);
    imgDiv.appendChild(i);
  });

  new bootstrap.Modal(document.getElementById("productModal")).show();
}
