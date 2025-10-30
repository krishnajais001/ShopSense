// Global State Management
const state = {
  products: [],
  filteredProducts: [],
  cart: [],
  currentPage: 'home',
  checkoutStep: 1,
  shippingInfo: {},
  orderId: '',
  selectedCategory: 'all',
  searchQuery: ''
};

// API Configuration
const API_URL = 'https://fakestoreapi.com/products';
const TAX_RATE = 0.08;

// DOM Elements
const elements = {
  productsGrid: document.getElementById('productsGrid'),
  loadingSpinner: document.getElementById('loadingSpinner'),
  errorMessage: document.getElementById('errorMessage'),
  cartBtn: document.getElementById('cartBtn'),
  cartCount: document.getElementById('cartCount'),
  cartSidebar: document.getElementById('cartSidebar'),
  cartOverlay: document.getElementById('cartOverlay'),
  cartContent: document.getElementById('cartContent'),
  cartFooter: document.getElementById('cartFooter'),
  cartTotal: document.getElementById('cartTotal'),
  closeCart: document.getElementById('closeCart'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  continueShopping: document.getElementById('continueShopping'),
  searchInput: document.getElementById('searchInput'),
  categorySelect: document.getElementById('categorySelect'),
  homePage: document.getElementById('homePage'),
  checkoutPage: document.getElementById('checkoutPage'),
  shippingForm: document.getElementById('shippingForm'),
  backToShipping: document.getElementById('backToShipping'),
  placeOrderBtn: document.getElementById('placeOrderBtn'),
  continueShoppingBtn: document.getElementById('continueShoppingBtn'),
  reviewItems: document.getElementById('reviewItems'),
  reviewSubtotal: document.getElementById('reviewSubtotal'),
  reviewTax: document.getElementById('reviewTax'),
  reviewTotal: document.getElementById('reviewTotal'),
  orderIdDisplay: document.getElementById('orderIdDisplay'),
  confirmationSummary: document.getElementById('confirmationSummary')
};

// Initialization
function init() {
  fetchProducts();
  attachEventListeners();
}

// Fetch Products from API
async function fetchProducts() {
  try {
    elements.loadingSpinner.style.display = 'flex';
    elements.errorMessage.style.display = 'none';
    elements.productsGrid.innerHTML = '';

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch products');

    state.products = await response.json();
    state.filteredProducts = state.products;

    elements.loadingSpinner.style.display = 'none';
    renderProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
    elements.loadingSpinner.style.display = 'none';
    elements.errorMessage.style.display = 'block';
  }
}

// Render Products
function renderProducts() {
  elements.productsGrid.innerHTML = '';

  if (state.filteredProducts.length === 0) {
    elements.productsGrid.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1/-1;">No products found.</p>';
    return;
  }

  state.filteredProducts.forEach(product => {
    const productCard = createProductCard(product);
    elements.productsGrid.appendChild(productCard);
  });
}

// Create Product Card
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const stars = '★'.repeat(Math.round(product.rating.rate));

  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}" class="product-image" />
    <h3 class="product-title">${product.title}</h3>
    <div class="product-rating">
      <span class="stars">${stars}</span>
      <span>(${product.rating.rate})</span>
    </div>
    <div class="product-price">$${product.price.toFixed(2)}</div>
    <button class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
      Add to Cart
    </button>
  `;

  const addToCartBtn = card.querySelector('.add-to-cart-btn');
  addToCartBtn.addEventListener('click', () => addToCart(product));

  return card;
}

// Add to Cart
function addToCart(product) {
  const existingItem = state.cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  updateCartUI();
  showNotification('Product added to cart!');
}

// Update Cart UI
function updateCartUI() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  elements.cartCount.textContent = totalItems;
  elements.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

  renderCart();
}

// Render Cart
function renderCart() {
  if (state.cart.length === 0) {
    elements.cartContent.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">🛒</div>
        <p>Your cart is empty</p>
      </div>
    `;
    elements.cartFooter.style.display = 'none';
    return;
  }

  elements.cartFooter.style.display = 'flex';

  elements.cartContent.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.title}" class="cart-item-image" />
      <div class="cart-item-details">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        <div class="cart-item-controls">
          <div class="quantity-controls">
            <button class="quantity-btn" data-id="${item.id}" data-action="decrease">−</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
          </div>
          <button class="remove-btn" data-id="${item.id}">🗑️ Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach event listeners for cart controls
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    btn.addEventListener('click', handleQuantityChange);
  });

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', handleRemoveItem);
  });

  updateCartTotal();
}

// Handle Quantity Change
function handleQuantityChange(e) {
  const id = parseInt(e.target.dataset.id);
  const action = e.target.dataset.action;
  const item = state.cart.find(item => item.id === id);

  if (!item) return;

  if (action === 'increase') {
    item.quantity += 1;
  } else if (action === 'decrease') {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      removeFromCart(id);
      return;
    }
  }

  updateCartUI();
}

// Handle Remove Item
function handleRemoveItem(e) {
  const id = parseInt(e.target.dataset.id);
  removeFromCart(id);
}

// Remove from Cart
function removeFromCart(id) {
  state.cart = state.cart.filter(item => item.id !== id);
  updateCartUI();
}

// Update Cart Total
function updateCartTotal() {
  const total = calculateSubtotal();
  elements.cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Calculate Subtotal
function calculateSubtotal() {
  return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Calculate Tax
function calculateTax() {
  return calculateSubtotal() * TAX_RATE;
}

// Calculate Total
function calculateTotal() {
  return calculateSubtotal() + calculateTax();
}

// Toggle Cart Sidebar
function toggleCart(show) {
  if (show) {
    elements.cartSidebar.classList.add('active');
    elements.cartOverlay.classList.add('active');
  } else {
    elements.cartSidebar.classList.remove('active');
    elements.cartOverlay.classList.remove('active');
  }
}

// Navigate to Page
function navigateToPage(page) {
  state.currentPage = page;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Show selected page
  if (page === 'home') {
    elements.homePage.classList.add('active');
    window.scrollTo(0, 0);
  } else if (page === 'checkout') {
    elements.checkoutPage.classList.add('active');
    state.checkoutStep = 1;
    showCheckoutStep(1);
    window.scrollTo(0, 0);
  }
}

// Show Checkout Step
function showCheckoutStep(step) {
  state.checkoutStep = step;

  // Update progress indicator
  document.querySelectorAll('.progress-step').forEach((el, index) => {
    el.classList.remove('active', 'completed');
    if (index + 1 < step) {
      el.classList.add('completed');
    } else if (index + 1 === step) {
      el.classList.add('active');
    }
  });

  // Show/hide checkout steps
  document.querySelectorAll('.checkout-step').forEach((el, index) => {
    el.classList.remove('active');
    if (index + 1 === step) {
      el.classList.add('active');
    }
  });

  if (step === 2) {
    renderOrderReview();
  }
}

// Validate Form Field
function validateField(fieldName, value) {
  const validationRules = {
    fullName: {
      required: true,
      minLength: 3,
      errorMessage: 'Full name must be at least 3 characters'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: 'Please enter a valid email address'
    },
    phone: {
      required: true,
      pattern: /^[0-9]{10}$/,
      errorMessage: 'Phone number must be 10 digits'
    },
    address: {
      required: true,
      minLength: 10,
      errorMessage: 'Please enter a complete address'
    },
    city: {
      required: true,
      minLength: 2,
      errorMessage: 'Please enter a valid city'
    },
    postalCode: {
      required: true,
      pattern: /^[0-9]{6}$/,
      errorMessage: 'Postal code must be 6 digits'
    }
  };

  const rule = validationRules[fieldName];
  if (!rule) return { valid: true };

  if (rule.required && !value.trim()) {
    return { valid: false, message: rule.errorMessage };
  }

  if (rule.minLength && value.trim().length < rule.minLength) {
    return { valid: false, message: rule.errorMessage };
  }

  if (rule.pattern && !rule.pattern.test(value.trim())) {
    return { valid: false, message: rule.errorMessage };
  }

  return { valid: true };
}

// Show Field Error
function showFieldError(fieldName, message) {
  const input = document.getElementById(fieldName);
  const errorElement = document.getElementById(`${fieldName}Error`);

  if (input && errorElement) {
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
}

// Clear Field Error
function clearFieldError(fieldName) {
  const input = document.getElementById(fieldName);
  const errorElement = document.getElementById(`${fieldName}Error`);

  if (input && errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
  }
}

// Validate All Form Fields
function validateAllFields() {
  const fields = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
  let isValid = true;

  fields.forEach(fieldName => {
    const input = document.getElementById(fieldName);
    const validation = validateField(fieldName, input.value);

    if (!validation.valid) {
      showFieldError(fieldName, validation.message);
      isValid = false;
    } else {
      clearFieldError(fieldName);
    }
  });

  return isValid;
}

// Handle Shipping Form Submit
function handleShippingFormSubmit(e) {
  e.preventDefault();

  if (!validateAllFields()) {
    return;
  }

  // Store shipping info
  const formData = new FormData(e.target);
  state.shippingInfo = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    postalCode: formData.get('postalCode')
  };

  showCheckoutStep(2);
}

// Render Order Review
function renderOrderReview() {
  elements.reviewItems.innerHTML = state.cart.map(item => `
    <div class="review-item">
      <img src="${item.image}" alt="${item.title}" class="review-item-image" />
      <div class="review-item-details">
        <div class="review-item-title">${item.title}</div>
        <div class="review-item-info">Quantity: ${item.quantity} × $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}</div>
      </div>
    </div>
  `).join('');

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  elements.reviewSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  elements.reviewTax.textContent = `$${tax.toFixed(2)}`;
  elements.reviewTotal.textContent = `$${total.toFixed(2)}`;
}

// Generate Order ID
function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let orderId = 'ORD-';
  for (let i = 0; i < 9; i++) {
    orderId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return orderId;
}

// Place Order
function placeOrder() {
  state.orderId = generateOrderId();
  showCheckoutStep(3);
  renderOrderConfirmation();
}

// Render Order Confirmation
function renderOrderConfirmation() {
  elements.orderIdDisplay.textContent = state.orderId;

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  elements.confirmationSummary.innerHTML = `
    ${state.cart.map(item => `
      <div class="confirmation-item">
        <span>${item.title} (×${item.quantity})</span>
        <span>$${(item.quantity * item.price).toFixed(2)}</span>
      </div>
    `).join('')}
    <div class="confirmation-item">
      <span>Subtotal:</span>
      <span>$${subtotal.toFixed(2)}</span>
    </div>
    <div class="confirmation-item">
      <span>Tax (8%):</span>
      <span>$${tax.toFixed(2)}</span>
    </div>
    <div class="confirmation-item confirmation-total">
      <span>Total Paid:</span>
      <span>$${total.toFixed(2)}</span>
    </div>
  `;
}

// Continue Shopping After Order
function continueShoppingAfterOrder() {
  state.cart = [];
  state.shippingInfo = {};
  state.orderId = '';
  updateCartUI();
  navigateToPage('home');
  elements.shippingForm.reset();
}

// Filter Products by Category
function filterByCategory(category) {
  state.selectedCategory = category;
  applyFilters();
}

// Filter Products by Search Query
function filterBySearch(query) {
  state.searchQuery = query.toLowerCase();
  applyFilters();
}

// Apply All Filters
function applyFilters() {
  state.filteredProducts = state.products.filter(product => {
    const matchesCategory = state.selectedCategory === 'all' || product.category === state.selectedCategory;
    const matchesSearch = state.searchQuery === '' || product.title.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesSearch;
  });

  renderProducts();
}

// Show Notification
function showNotification(message) {
  // Simple console notification (can be enhanced with a toast component)
  console.log('Notification:', message);
}

// Attach Event Listeners
function attachEventListeners() {
  // Cart controls
  elements.cartBtn.addEventListener('click', () => toggleCart(true));
  elements.closeCart.addEventListener('click', () => toggleCart(false));
  elements.cartOverlay.addEventListener('click', () => toggleCart(false));
  elements.continueShopping.addEventListener('click', () => toggleCart(false));

  // Checkout navigation
  elements.checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) return;
    toggleCart(false);
    navigateToPage('checkout');
  });

  // Shipping form
  elements.shippingForm.addEventListener('submit', handleShippingFormSubmit);

  // Form field validation on blur
  const formFields = ['fullName', 'email', 'phone', 'address', 'city', 'postalCode'];
  formFields.forEach(fieldName => {
    const input = document.getElementById(fieldName);
    if (input) {
      input.addEventListener('blur', () => {
        const validation = validateField(fieldName, input.value);
        if (!validation.valid) {
          showFieldError(fieldName, validation.message);
        } else {
          clearFieldError(fieldName);
        }
      });

      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          const validation = validateField(fieldName, input.value);
          if (validation.valid) {
            clearFieldError(fieldName);
          }
        }
      });
    }
  });

  // Checkout step navigation
  elements.backToShipping.addEventListener('click', () => showCheckoutStep(1));
  elements.placeOrderBtn.addEventListener('click', placeOrder);
  elements.continueShoppingBtn.addEventListener('click', continueShoppingAfterOrder);

  // Search and filter
  elements.searchInput.addEventListener('input', (e) => {
    filterBySearch(e.target.value);
  });

  elements.categorySelect.addEventListener('change', (e) => {
    filterByCategory(e.target.value);
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}