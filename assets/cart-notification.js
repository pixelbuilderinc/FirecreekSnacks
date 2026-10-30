class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);

    this.lastAddedProduct = null; // Store last-added product info

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  // New method to store last-added product info
  setLastAddedProduct(product) {
    this.lastAddedProduct = product;
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.notification.classList.remove('active');
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) {
    // If no sections exist for the newly added item, fall back to lastAddedProduct
    if (!parsedState || !parsedState.sections) {
      const productContainer = document.getElementById('cart-notification-product');
      if (this.lastAddedProduct && productContainer) {
        productContainer.innerHTML = `
          <div class="cart-notification-product__image global-media-settings">
            <img src="${this.lastAddedProduct.image}" alt="${this.lastAddedProduct.title}" width="70" height="70" loading="lazy">
          </div>
          <div>
            <h3 class="cart-notification-product__name h4">${this.lastAddedProduct.title}</h3>
            <span class="selling-plan-details">${this.lastAddedProduct.sellingPlan}</span>
            ${this.lastAddedProduct.variant && this.lastAddedProduct.variant !== 'Default Title' ? `<p class="product-option">${this.lastAddedProduct.variant}</p>` : ''}
          </div>
        `;
      }
      this.open();
      return;
    }

    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      const container = document.getElementById(section.id);
      if (container && parsedState.sections[section.id]) {
        container.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.id],
          section.selector
        );
      }
    });

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      { id: 'cart-notification-product', selector: `[id="cart-notification-product-${this.cartItemKey}"]` },
      { id: 'cart-notification-button' },
      { id: 'cart-icon-bubble' },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const sectionEl = doc.querySelector(selector);
    return sectionEl ? sectionEl.innerHTML : '';
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
