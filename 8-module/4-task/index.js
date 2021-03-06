import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
    this.onSubmit = this.onSubmit.bind(this);
  }

  addProduct(product) {
    const productItem = {
      product: {},
      count: 1
    };

    const cartItem = this.cartItems.find(item => item.product.id == product.id);

    if ( !cartItem ) {
      Object.assign(productItem.product, product);
      this.cartItems.push(productItem); 
    }
    else {
      cartItem.count++;
    }

    this.onProductUpdate(cartItem);
  }

  updateProductCount(productId, amount) {
    const cartItem = this.cartItems.find(item => item.product.id == productId);
    const cartItemIndex = this.cartItems.findIndex(item => item.product.id == productId);

    cartItem.count += amount;
    

    if ( cartItem.count == 0 ) {
      this._cartItemId = this.cartItems[cartItemIndex].product.id;
      this.cartItems.splice(cartItemIndex, 1);
    }

    this.onProductUpdate(cartItem);
  }

  isEmpty() {
    return !Boolean(this.cartItems.length);
  }

  getTotalCount() {
    return this.cartItems.reduce(( totalCount, item ) => totalCount + item.count, 0);
  }

  getTotalPrice() {
    return this.cartItems.reduce(( totalPrice, item ) => totalPrice + item.product.price * item.count, 0);
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${
      product.id
    }">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(
              2
            )}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modal = new Modal();
    
    this._modalBody = createElement('<div></div>');
    this.cartItems.forEach( item => this._modalBody.append(this.renderProduct(item.product, item.count)) );
    this._modalBody.append(this.renderOrderForm());

    this.modal.setTitle('Your order');
    this.modal.setBody(this._modalBody);
    this.modal.open();

    document.querySelector('.modal__body').addEventListener('click', (evt) => {
      const target = evt.target; 

      let productId = '';

      if ( target.closest('.cart-counter__button_minus') ) {
        productId = target.closest('.cart-product').dataset.productId;
        this.updateProductCount(productId, -1);
      }
      else if ( target.closest('.cart-counter__button_plus') ) {
        productId = target.closest('.cart-product').dataset.productId;
        this.updateProductCount(productId, 1);
      }
    })

    this._cartForm.addEventListener('submit', this.onSubmit);
  }

  onProductUpdate(cartItem) {
    this.cartIcon.update(this);
    
    if ( !document.body.classList.contains('is-modal-open') ) {
      return;
    }

    if ( this.cartItems.length == 0 ) { 
      this.modal.close();
      return;
    }

    let productId = cartItem.product.id;
    let productCount = document.querySelector(`[data-product-id="${productId}"] .cart-counter__count`); 
    let productPrice = document.querySelector(`[data-product-id="${productId}"] .cart-product__price`); 
    let infoPrice = document.querySelector(`.cart-buttons__info-price`);

    if ( cartItem.count == 0 ) {
      document.querySelector(`[data-product-id="${this._cartItemId}"]`).remove();
      infoPrice.innerHTML = `€${this.getTotalPrice().toFixed(2)}`;
      return;
    }

    productCount.innerHTML = cartItem.count;
    productPrice.innerHTML = `€${(cartItem.product.price * cartItem.count).toFixed(2)}`
    infoPrice.innerHTML = `€${this.getTotalPrice().toFixed(2)}`;
  }

  async onSubmit(event) {
    event.preventDefault();
    document.querySelector('[type="submit"]').classList.add('is-loading');

    const formData = new FormData(this._cartForm);

    await fetch('https://httpbin.org/post', {
      body: formData,
      method: 'POST',
    })

    this.modal.setTitle('Success!');
    this.modal.setBody(createElement(this._modalSuccessTemplate()));
    this.cartItems = [];
    this.cartIcon.update(this);
  }


  _modalSuccessTemplate() {
    return `<div class="modal__body-inner">
    <p>Order successful! Your order is being cooked :) <br>
      We’ll notify you about delivery time shortly.<br>
      <img src="/assets/images/delivery.gif">
    </p>
    </div>`
  }

  get _cartForm() {
    return document.querySelector('.cart-form');
  }

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}

