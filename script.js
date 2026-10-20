// Cineplus+ Full Interactive Engine (Cart, Quantities, Custom Items, Seats, Modals, Geolocation & Invoice Checkout)

function selectAndBook(name, price, type, qtyId = null, checkboxId = null) {
    if (checkboxId) {
        let chk = document.getElementById(checkboxId);
        if (chk && !chk.checked) {
            alert('Please check the box to select this item.');
            return;
        }
    }

    let quantity = 1;
    if (qtyId) {
        let inputElem = document.getElementById(qtyId);
        if (inputElem) {
            quantity = parseInt(inputElem.value) || 1;
        }
    }

    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    let existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ name: name, price: price, type: type, quantity: quantity });
    }

    localStorage.setItem('cineplus_cart', JSON.stringify(cart));
    window.location.href = 'booking.html';
}

function addCustomTextItem() {
    let textInput = document.getElementById('custom-item-text');
    let priceInput = document.getElementById('custom-item-price');

    if (!textInput || !textInput.value.trim()) {
        alert('Please enter a valid item name or special request.');
        return;
    }

    let itemName = textInput.value.trim();
    let itemPrice = parseFloat(priceInput ? priceInput.value : 0) || 0;

    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    cart.push({ name: `Special Request: ${itemName}`, price: itemPrice, type: 'Custom Item', quantity: 1 });

    localStorage.setItem('cineplus_cart', JSON.stringify(cart));
    textInput.value = '';
    loadCartSummary();
}

function updateCartQuantity(index, newQty) {
    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    let qty = parseInt(newQty);
    if (qty <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = qty;
    }
    localStorage.setItem('cineplus_cart', JSON.stringify(cart));
    loadCartSummary();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cineplus_cart', JSON.stringify(cart));
    loadCartSummary();
}

function loadCartSummary() {
    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    let cartContainer = document.getElementById('cart-items-container');
    let subtotalElem = document.getElementById('cart-subtotal');
    let discountElem = document.getElementById('cart-discount-amount');
    let totalElem = document.getElementById('cart-final-total');
    
    if (!cartContainer) return;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">Your cart is currently empty. Select movies or food from the catalogs!</p>';
        if (subtotalElem) subtotalElem.innerText = 'PHP 0.00';
        if (discountElem) discountElem.innerText = 'PHP 0.00';
        if (totalElem) totalElem.innerText = 'PHP 0.00';
        return;
    }

    let html = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #111; padding: 12px 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #333; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h4 style="color: #fff; margin: 0 0 4px 0; font-size: 1rem;">${item.name}</h4>
                    <span style="color: #FFD700; font-size: 0.8rem; text-transform: uppercase;">${item.type}</span> | 
                    <span style="color: #aaa; font-size: 0.85rem;">PHP ${item.price.toFixed(2)} each</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <label style="color: #aaa; font-size: 0.8rem;">Qty:</label>
                    <input type="number" min="1" max="20" value="${item.quantity}" onchange="updateCartQuantity(${index}, this.value)" style="width: 50px; background: #222; border: 1px solid #444; color: #fff; text-align: center; border-radius: 4px; padding: 4px;">
                    <span style="color: #fff; font-weight: bold; min-width: 90px; text-align: right;">PHP ${itemTotal.toFixed(2)}</span>
                    <button onclick="removeItem(${index})" style="background: #ff4d4d; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">✕</button>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = html;
    
    let discountRate = 0;
    let discountSelect = document.getElementById('discount-selector');
    if (discountSelect) {
        discountRate = parseFloat(discountSelect.value) || 0;
    }

    let discountAmount = subtotal * discountRate;
    let finalTotal = subtotal - discountAmount;

    if (subtotalElem) subtotalElem.innerText = `PHP ${subtotal.toFixed(2)}`;
    if (discountElem) discountElem.innerText = `-PHP ${discountAmount.toFixed(2)}`;
    if (totalElem) totalElem.innerText = `PHP ${finalTotal.toFixed(2)}`;
}

// Checkout Trigger Handler
function proceedToCheckout() {
    let cart = JSON.parse(localStorage.getItem('cineplus_cart')) || [];
    let seats = JSON.parse(localStorage.getItem('cineplus_seats')) || [];

    if (cart.length === 0) {
        alert('Your cart is empty. Please select a movie or food item before checking out.');
        return;
    }
    if (seats.length === 0) {
        alert('Please select at least one seat from the theater seat map before proceeding.');
        return;
    }

    // Save discount option text for the invoice page
    let discountSelect = document.getElementById('discount-selector');
    let discountLabel = discountSelect ? discountSelect.options[discountSelect.selectedIndex].text : 'Regular Price';
    let discountRate = discountSelect ? parseFloat(discountSelect.value) || 0 : 0;

    localStorage.setItem('cineplus_checkout_discount_label', discountLabel);
    localStorage.setItem('cineplus_checkout_discount_rate', discountRate);

    window.location.href = 'invoice.html';
}

// Interactive Seat Selection
function renderSeatMap() {
    let seatGrid = document.getElementById('seat-grid');
    if (!seatGrid) return;

    let rows = ['A', 'B', 'C', 'D'];
    let cols = 8;
    let selectedSeats = JSON.parse(localStorage.getItem('cineplus_seats')) || [];
    
    let html = '';
    rows.forEach(row => {
        for (let i = 1; i <= cols; i++) {
            let seatId = `${row}${i}`;
            let isOccupied = ['A3', 'B5', 'C2', 'D7'].includes(seatId);
            let isSelected = selectedSeats.includes(seatId);

            let bgStyle = 'background: #222; border: 1px solid #444; color: #fff; cursor: pointer;';
            if (isOccupied) {
                bgStyle = 'background: #ff4d4d; color: #fff; cursor: not-allowed; opacity: 0.6;';
            } else if (isSelected) {
                bgStyle = 'background: #FFD700; color: #000; font-weight: bold; cursor: pointer;';
            }

            html += `
                <button type="button" onclick="toggleSeat('${seatId}', ${isOccupied})" style="padding: 10px 0; border-radius: 6px; font-size: 0.85rem; ${bgStyle}">
                    ${seatId}
                </button>
            `;
        }
    });
    seatGrid.innerHTML = html;
}

function toggleSeat(seatId, isOccupied) {
    if (isOccupied) return;
    let selectedSeats = JSON.parse(localStorage.getItem('cineplus_seats')) || [];
    
    let index = selectedSeats.indexOf(seatId);
    if (index > -1) {
        selectedSeats.splice(index, 1);
    } else {
        selectedSeats.push(seatId);
    }
    
    localStorage.setItem('cineplus_seats', JSON.stringify(selectedSeats));
    renderSeatMap();
}

// Geolocation API Detection
function initGeolocation() {
    let activeBranch = localStorage.getItem('cineplus_branch') || 'Cineplus+ Quezon City Flagship Hub';
    
    if (navigator.geolocation && !localStorage.getItem('cineplus_branch')) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                let lat = position.coords.latitude;
                if (lat > 14.65) {
                    activeBranch = 'Cineplus+ Quezon City Flagship Hub';
                } else {
                    activeBranch = 'Cineplus+ Rizal Branch';
                }
                localStorage.setItem('cineplus_branch', activeBranch);
                updateBranchUI(activeBranch);
            },
            () => {
                updateBranchUI(activeBranch);
            }
        );
    } else {
        updateBranchUI(activeBranch);
    }
}

function updateBranchUI(branchName) {
    let branchElem = document.getElementById('user-branch-text');
    if (branchElem) {
        branchElem.innerText = branchName;
    }
}

// Modals (Search & Profile)
function setupModals() {
    if (document.getElementById('cineplus-modals-injected')) return;

    let activeBranch = localStorage.getItem('cineplus_branch') || 'Cineplus+ Quezon City Flagship Hub';

    const modalHTML = `
        <div id="cineplus-modals-injected">
            <div id="search-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;">
                <div style="background:#151515; border:1px solid #333; padding:30px; border-radius:12px; width:90%; max-width:500px; text-align:center; position:relative;">
                    <button onclick="closeModals()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✕</button>
                    <h3 style="color:#FFD700; margin-bottom:15px;">Search Cineplus+</h3>
                    <input type="text" id="search-input" placeholder="Search movies or food bundles..." style="width:100%; padding:12px; background:#222; border:1px solid #444; color:#fff; border-radius:6px; font-size:1rem; outline:none; margin-bottom:15px;" onkeyup="filterCatalog(event)">
                    <p style="color:#888; font-size:0.85rem;">Type a keyword (e.g., Avengers, Popcorn, Batman) and press Enter.</p>
                </div>
            </div>

            <div id="profile-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center;">
                <div style="background:#151515; border:1px solid #333; padding:30px; border-radius:12px; width:90%; max-width:400px; text-align:center; position:relative;">
                    <button onclick="closeModals()" style="position:absolute; top:15px; right:15px; background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✕</button>
                    <div style="width:80px; height:80px; background:#FFD700; color:#000; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold; margin:0 auto 15px auto;">CB</div>
                    <h3 style="color:#fff; margin-bottom:5px;">Charles Justine T. Banan</h3>
                    <p style="color:#FFD700; font-size:0.85rem; margin-bottom:15px;">VIP Cinema Member</p>
                    <p style="color:#aaa; font-size:0.9rem; margin-bottom:20px;">
                        Nearest Branch: <br><strong id="user-branch-text" style="color: #4ecca3;">${activeBranch}</strong><br>
                        Status: Active Session
                    </p>
                    <button onclick="closeModals()" style="background:#333; color:#fff; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold;">Close Profile</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const navIcons = document.querySelectorAll('.nav-icons .icon-btn');
    if (navIcons.length >= 2) {
        navIcons[0].onclick = openSearchModal;
        navIcons[1].onclick = openProfileModal;
    }
}

function openSearchModal() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function openProfileModal() {
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeModals() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('profile-modal').style.display = 'none';
}

function filterCatalog(e) {
    if (e.key === 'Enter') {
        let query = document.getElementById('search-input').value.toLowerCase();
        if (query.includes('food') || query.includes('popcorn') || query.includes('drink') || query.includes('combo')) {
            window.location.href = 'food.html';
        } else {
            window.location.href = 'movies.html';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadCartSummary();
    renderSeatMap();
    setupModals();
    initGeolocation();
    let discountSelect = document.getElementById('discount-selector');
    if (discountSelect) {
        discountSelect.addEventListener('change', loadCartSummary);
    }
});
