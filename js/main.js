/* ============================================
   SVADA  Main JavaScript
   ============================================ */

/* ---------- NAV SCROLL ---------- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});
/* ---------- SLIDE-IN MENU ---------- */
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobile-menu');
const menuOverlay  = document.getElementById('menu-overlay');
const menuCloseBtn = document.getElementById('menu-close');

function openMenu() {
  mobileMenu.classList.add('open');
  menuOverlay.classList.add('open');
  document.body.style.overflow = 'hidden'; // prevent scroll behind menu
  const spans = hamburger.querySelectorAll('span');
  spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
  spans[1].style.opacity = '0';
  spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  menuOverlay.classList.remove('open');
  document.body.style.overflow = '';
  hamburger.querySelectorAll('span').forEach(s => {
    s.style.transform = '';
    s.style.opacity = '';
  });
}

hamburger.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});

// Close on X button
if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);

// Close on overlay click
menuOverlay.addEventListener('click', closeMenu);

// Close on link click (excluding the dropdown trigger)
mobileMenu.querySelectorAll('a:not(.dropdown-trigger)').forEach(a => {
  a.addEventListener('click', closeMenu);
});

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
});

/* ---------- MOBILE DROPDOWN TOGGLE ---------- */
const dropdown = document.getElementById('products-dropdown');
const trigger = dropdown?.querySelector('.dropdown-trigger');

if (trigger) {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    dropdown.classList.toggle('active');
  });
}

// Ensure sub-links in the dropdown also close the menu when clicked
dropdown?.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

/* ---------- REVEAL ON SCROLL ---------- */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

/* ---------- COUNTER ANIMATION ---------- */
function animateCounter(el, target, suffix) {
  let start = 0;
  const duration = 2000;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const statNums = document.querySelectorAll('.stat-num');
let countersStarted = false;
const statsObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !countersStarted) {
    countersStarted = true;
    statNums.forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      animateCounter(el, target);
    });
  }
}, { threshold: 0.5 });
if (statNums.length) statsObserver.observe(statNums[0].closest('.hero-stats'));

/* ---------- FLAVOR CARD 3D TILT ---------- */
document.querySelectorAll('.flavor-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 16;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 16;
    card.style.transform = `translateY(-8px) perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.6s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s';
    setTimeout(() => { card.style.transition = ''; }, 600);
  });
});

// (Hero parallax orbs removed)

/* ---------- SMOOTH SCROLL ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  });
});

/* ---------- MARQUEE PAUSE ON HOVER ---------- */
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => {
    marqueeTrack.style.animationPlayState = 'paused';
  });
  marqueeTrack.addEventListener('mouseleave', () => {
    marqueeTrack.style.animationPlayState = 'running';
  });
}

/* ---------- LOADER DISMISS ---------- */
window.addEventListener('load', () => {
  const loader = document.getElementById('svada-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }, 2100);
  }
});


/* ============================================
   CART SYSTEM  (WhatsApp Ordering)
   ============================================ */
(function () {
  const WHATSAPP_NUMBER = '916366999115'; // no + or spaces

  const cartToggle   = document.getElementById('cart-toggle');
  const cartOverlay  = document.getElementById('cart-overlay');
  const cartDrawer   = document.getElementById('cart-drawer');
  const cartClose    = document.getElementById('cart-close');
  const cartItemsEl  = document.getElementById('cart-items');
  const cartEmptyEl  = document.getElementById('cart-empty');
  const cartCountEl  = document.getElementById('cart-count');
  const cartTotalEl  = document.getElementById('cart-total');
  const cartNameEl   = document.getElementById('cart-name');
  const cartAddressEl= document.getElementById('cart-address');
  const placeOrderBtn= document.getElementById('place-order-btn');
  const openCartBtn  = document.getElementById('open-cart-btn');
  const addedToast   = document.getElementById('added-toast');

  if (!cartDrawer) return; // cart markup not present on this page

  /* ---------- STATE ---------- */
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem('svada_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart() {
    try { localStorage.setItem('svada_cart', JSON.stringify(cart)); } catch (e) {}
  }

  /* ---------- SIZE CARD ADD TO CART ---------- */
  document.querySelectorAll('.size-card').forEach(card => {
    card.querySelector('.add-to-cart-btn')?.addEventListener('click', (e) => {
      addToCart({
        name: card.dataset.name,
        grams: card.dataset.grams,
        price: parseFloat(card.dataset.price),
        qty: 1
      });

      // button feedback
      const btn = e.currentTarget;
      btn.classList.add('added');
      btn.textContent = 'Added ✓';
      setTimeout(() => {
        btn.classList.remove('added');
        btn.textContent = 'Add to Cart';
      }, 900);

      showToast();
      bumpCartCount();
    });
  });

  /* ---------- CART OPERATIONS ---------- */
  function addToCart(item) {
    const existing = cart.find(i => i.name === item.name);
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    saveCart();
    renderCart();
  }

  function updateQty(name, delta) {
    const item = cart.find(i => i.name === name);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.name !== name);
    }
    saveCart();
    renderCart();
  }

  function removeItem(name) {
    cart = cart.filter(i => i.name !== name);
    saveCart();
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function cartItemCount() {
    return cart.reduce((sum, i) => sum + i.qty, 0);
  }

  /* ---------- RENDER ---------- */
  function renderCart() {
    // badge
    const count = cartItemCount();
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.style.display = count > 0 ? 'flex' : 'none';
    }

    // View Cart button only appears once something's been added
    openCartBtn?.classList.toggle('show', count > 0);

    // items list
    cartItemsEl.innerHTML = '';
    if (cart.length === 0) {
      cartEmptyEl.style.display = 'block';
      cartItemsEl.appendChild(cartEmptyEl);
      placeOrderBtn.disabled = true;
    } else {
      cartEmptyEl.style.display = 'none';
      placeOrderBtn.disabled = false;

      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(item.name)} <span style="font-family: 'DM Sans', sans-serif; color:var(--text-muted); font-weight:500;">(${escapeHtml(item.grams)})</span></div>
            <div class="cart-item-meta">₹${item.price} each</div>
            <div class="cart-item-qty">
              <button class="qty-btn item-qty-minus" aria-label="Decrease quantity">−</button>
              <span class="qty-val">${item.qty}</span>
              <button class="qty-btn item-qty-plus" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="cart-item-price">₹${item.price * item.qty}</div>
          <button class="cart-item-remove" aria-label="Remove item">&times;</button>
        `;

        row.querySelector('.item-qty-minus').addEventListener('click', () => updateQty(item.name, -1));
        row.querySelector('.item-qty-plus').addEventListener('click', () => updateQty(item.name, 1));
        row.querySelector('.cart-item-remove').addEventListener('click', () => removeItem(item.name));

        cartItemsEl.appendChild(row);
      });
    }

    cartTotalEl.textContent = `₹${cartTotal()}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function bumpCartCount() {
    if (!cartCountEl) return;
    cartCountEl.classList.remove('bump');
    void cartCountEl.offsetWidth; // restart animation
    cartCountEl.classList.add('bump');
  }

  function showToast() {
    if (!addedToast) return;
    addedToast.style.opacity = '1';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { addedToast.style.opacity = '0'; }, 1800);
  }

  /* ---------- DRAWER OPEN / CLOSE ---------- */
  function openCart() {
    renderCart();
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.classList.add('cart-open');
  }
  function closeCart() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.classList.remove('cart-open');
  }

  cartToggle?.addEventListener('click', openCart);
  openCartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  /* ---------- PLACE ORDER -> WHATSAPP ---------- */
  placeOrderBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;

    const name = cartNameEl.value.trim();
    const address = cartAddressEl.value.trim();

    if (!name) {
      cartNameEl.focus();
      cartNameEl.style.borderColor = '#d9534f';
      setTimeout(() => { cartNameEl.style.borderColor = ''; }, 1500);
      return;
    }

    let msg = `Hi Svada! I'd like to place an order:\n\n`;
    cart.forEach(item => {
      msg += `• ${item.name} (${item.grams}) x${item.qty} — ₹${item.price * item.qty}\n`;
    });
    msg += `\nTotal: ₹${cartTotal()}\n`;
    msg += `\nName: ${name}`;
    if (address) msg += `\nDelivery Address: ${address}`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  });

  /* ---------- INIT ---------- */
  renderCart();
})();

/* ============================================
   FAQ ACCORDION
   ============================================ */
(function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-question');

  if (!faqButtons.length) return;

  function closeFaq(button) {
    const item = button.closest('.faq-item');
    const answerId = button.getAttribute('aria-controls');
    const answer = answerId ? document.getElementById(answerId) : null;

    if (!item || !answer) return;

    item.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    answer.setAttribute('aria-hidden', 'true');
  }

  function openFaq(button) {
    const item = button.closest('.faq-item');
    const answerId = button.getAttribute('aria-controls');
    const answer = answerId ? document.getElementById(answerId) : null;

    if (!item || !answer) return;

    item.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
    answer.setAttribute('aria-hidden', 'false');
  }

  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const isOpen = button.getAttribute('aria-expanded') === 'true';

      // Keep only one answer open at a time.
      faqButtons.forEach(otherButton => {
        if (otherButton !== button) closeFaq(otherButton);
      });

      if (isOpen) {
        closeFaq(button);
      } else {
        openFaq(button);
      }
    });
  });
})();
