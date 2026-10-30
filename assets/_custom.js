u_FormatMoney = (cents, format) => {
  if (typeof cents == 'string') { cents = cents.replace('.', ''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
    return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  var match = formatString.match(placeholderRegex);

  if (match) {
    switch (match[1]) {
      case 'amount':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }
  }

  return formatString.replace(placeholderRegex, value);
};

document.addEventListener('alpine:init', () => {
  Alpine.store('ProductForm', {
    selected: {
      type: 'subscribe', // 'one-time' or 'subscribe'
      frequency: '',
      plan: null,
      plan_index: 0,
      quantity: 1
    },
    init() {
      Alpine.effect(() => {
        // console.log('ProductForm store selected changed:', this.selected);
        document.dispatchEvent(new CustomEvent('product-form:change', { detail: this.selected }));
      });
    }
  });

  Alpine.data('SubscriptionWidget', () => ({
    money_format: '${{amount}}',
    product: null,
    selected_variant: null,
    selling_plans: [],
    selected: {
      type: 'subscribe', // 'one-time' or 'subscribe'
      frequency: '',
      plan: null,
      plan_index: 0,
      quantity: 1,
      variant: null
    },
    details_open: false,
    init() {
      this.InitWatchers();
      this.InitSelf();
    },
    InitSelf() {
      this.money_format = this.$el.dataset.money_format;
      let product = JSON.parse(this.$el.dataset.product);
      this.product = product;
      // console.log(product);
      this.selected_variant = JSON.parse(this.$el.dataset.selected_variant);
      this.selected.variant = this.selected_variant;
    },
    InitWatchers() {
      let $product = this.$el.closest('.product__info-container');
      let $quantity = $product.querySelector('[name=quantity]');
      if ($quantity) {
        $quantity.addEventListener('change', (e) => {
          this.selected.quantity = parseInt(e.target.value);
        });
      }

      // Listen to selected frequency to update selected plan
      this.$watch('selected.frequency', () => {
        let plan = this.selling_plans.find(plan => plan.selling_plan_id == this.selected.frequency);
        this.selected.plan_index = this.selling_plans.findIndex(plan => plan.selling_plan_id == this.selected.frequency);
        this.selected.plan = plan;
      });

      // Listen to selected variant to update selling plans
      this.$watch('selected_variant', () => {
        this.selected.quantity = 1;
        this.selected.variant = this.selected_variant;
        this.SetSellingPlans();
      });

      // Listen to variant change event to update selected_variant
      subscribe(PUB_SUB_EVENTS.variantChange, (e) => {
        // console.log(e);
        this.selected_variant = e.data.variant;
      });

      // Listen to changes to update button price
      this.$watch('selected', this.u_UpdateBtnPrice.bind(this));
      this.$watch('selected', () => {
        Alpine.store('ProductForm').selected = this.selected;
      });
    },
    SetSellingPlans() {
  const group = this.product.selling_plan_groups.find(
  group => group.name === 'Subscribe and save'
);



  if (!group) {
    this.selling_plans = [];
    this.selected.plan = null;
    this.selected.frequency = '';
    return;
  }

  const selling_plans = this.selected_variant.selling_plan_allocations
  .map(item => {
    

    const plan = group.selling_plans.find(
      p => p.id == item.selling_plan_id
    );

    if (!plan) return null;

    return {
      ...item,
      ...plan,
      name: plan.name.trim()
    };
  })
  .filter(Boolean);

  // Sort plans in your preferred order
  const order = ['Every Month', 'Every 2 Weeks', 'Every 2 Months'];

  selling_plans.sort((a, b) => {
    const ai = order.indexOf(a.name);
    const bi = order.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  this.selling_plans = selling_plans;
  

  if (selling_plans.length) {
    this.selected.plan_index = 0;
    this.selected.plan = selling_plans[0];
    this.selected.frequency = selling_plans[0].selling_plan_id;
  } else {
    this.selected.plan = null;
    this.selected.frequency = '';
  }
},
    u_FormatMoney(value) {
      return u_FormatMoney(value, this.money_format);
    },
    u_UpdateBtnPrice() {
      this.$nextTick(() => {
        // console.log(this.querySelectorAll('.product-form__submit .price-item--sale.price-item--last'));
        document.querySelectorAll('.product-form__submit .price-item--sale.price-item--last, .product-form__submit .price__regular .price-item--regular').forEach(($btn_price) => {
          let subscription_price = this.selected.plan ? this.selected.plan.price : 0;
          // console.log(this.selected)
          let one_time_price = this.selected_variant.price;
          let is_subscription = this.selected.type == 'subscribe';
          
          let price = is_subscription ? subscription_price : one_time_price;
          // console.log(price, quantity, u_ExtractCurrencySymbolUnicode(price));
          $btn_price.textContent = `${u_FormatMoney(price * this.selected.quantity, this.money_format)}`;
        })
      }, 0);
    }
  }));

  Alpine.data('VariantPricePerPack', (variant) => ({
    variant: variant,
    price_per_pack: 0,
    GetPricePerPack() {
      let selected = Alpine.store('ProductForm').selected;

      let pack_count = 0;
      if (variant.title.includes('10-Pack')) {
        pack_count = 10;
      }
      else if (variant.title.includes('20-Pack')) {
        pack_count = 20;
      }
      else if (variant.title.includes('80-Pack')) {
        pack_count = 80;
      }

      let variant_price = variant.price;
      if (selected.type == 'subscribe') {
        let plan = variant.selling_plan_allocations.find(item => item.selling_plan_id == selected.frequency);
        if (plan) {
          variant_price = plan.price;
        }
      }

      return (variant_price / pack_count / 100).toFixed(2);
    },
    u_FormatMoney(value) {
      return u_FormatMoney(value, window.money_format);
    }
  }));
});