/* =========================================================
   Carrio Motors - single-page application logic (jQuery)
   Data store: JSON files in /data (fallback copy in data-fallback.js)
   ========================================================= */
(function ($) {
  'use strict';

  var DATA_FILES = ['cars', 'brands', 'categories', 'warranty', 'finance', 'company', 'slides', 'gallery'];
  var DB = {};
  var MOBILE = 992;

  /* ---------- Helpers ---------- */
  function money(n) { return 'PKR ' + Math.round(n).toLocaleString('en-US'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function brandOf(id) { return DB.brands.find(function (b) { return b.id === id; }) || { name: id, short: id }; }
  function catOf(id) { return DB.categories.find(function (c) { return c.id === id; }) || { name: id }; }
  function carOf(id) { return DB.cars.find(function (c) { return c.id === id; }); }
  function param(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  var PAGE = document.body.getAttribute('data-page') || 'index';
  function hp(car) { return parseInt(car.specs.power, 10) || 0; }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* ---------- 1. Load JSON data ---------- */
  function loadData() {
    var fromFallback = function () { return $.Deferred().resolve(window.CARRIO_DATA).promise(); };
    if (location.protocol === 'file:') return fromFallback();
    var calls = DATA_FILES.map(function (name) { return $.getJSON('data/' + name + '.json'); });
    return $.when.apply($, calls).then(function () {
      var out = {};
      var args = arguments;
      DATA_FILES.forEach(function (name, i) { out[name] = args[i][0]; });
      return out;
    }, fromFallback);
  }

  /* ---------- 2. Company details ---------- */
  function fillCompany() {
    var c = DB.company;
    $('[data-company="phone"]').text(c.phone);
    $('[data-company="hours"]').text(c.hours);
    $('[data-company="headOffice"]').text(c.headOffice);
    $('[data-company="slogan"]').text(c.slogan);
    $('[data-company="emailLink"]').text(c.email).attr('href', 'mailto:' + c.email);
    $('[data-company="phoneLink"]').text(c.phone).attr('href', 'tel:' + c.phone.replace(/\s/g, ''));
    $('#year').text(new Date().getFullYear());
  }

  /* ---------- 3. Visitor count (top right, beside logo) ---------- */
  function visitorCounter() {
    var visits = parseInt(store('carrio_visits'), 10) || 0;
    var counted = false;
    try { counted = sessionStorage.getItem('carrio_counted'); } catch (e) { /* ignore */ }
    if (!counted) {
      visits += 1;
      store('carrio_visits', visits);
      try { sessionStorage.setItem('carrio_counted', '1'); } catch (e) { /* ignore */ }
    }
    var total = String(DB.company.visitorBase + visits);
    while (total.length < 6) total = '0' + total;

    var $odo = $('#visitorCount').empty().attr('aria-label', 'Visitor count ' + Number(total));
    total.split('').forEach(function (d) {
      var col = '';
      for (var i = 0; i <= 9; i++) col += '<span>' + i + '</span>';
      $odo.append('<span class="digit" aria-hidden="true"><span class="roll" data-d="' + d + '">' + col + '</span></span>');
    });
    setTimeout(function () {
      $odo.find('.roll').each(function () {
        $(this).css('transform', 'translateY(-' + ($(this).data('d') * 1.45) + 'em)');
      });
    }, 200);
  }

  /* ---------- 4. Menu: hover colour, colour after click, fade in / out ---------- */
  // The menu item for the current page keeps the "clicked" colour
  function setActive() {
    var target = PAGE + '.html';
    $('#menuList .nav-link').removeClass('active')
      .filter(function () { return $(this).attr('href').split('?')[0] === target; }).addClass('active');
  }

  function menu() {
    var $list = $('#menuList');
    var $toggle = $('#menuToggle');

    $toggle.on('click', function () {
      var open = $toggle.attr('aria-expanded') === 'true';
      $toggle.attr('aria-expanded', String(!open));
      $list.stop(true, true)[open ? 'fadeOut' : 'fadeIn'](200);
    });

    // Desktop drop-downs fade in and out on hover and keyboard focus
    $('.has-drop').on('mouseenter focusin', function () {
      if (window.innerWidth >= MOBILE) $(this).children('.drop').stop(true, true).fadeIn(180);
    }).on('mouseleave focusout', function (e) {
      if (window.innerWidth < MOBILE) return;
      var $li = $(this);
      if (e.type === 'focusout' && $li.has(e.relatedTarget).length) return;
      $li.children('.drop').stop(true, true).fadeOut(180);
    });

    // Clicked item changes colour straight away, before the next page opens
    $('#menuList .nav-link').on('click', function () {
      $('#menuList .nav-link').removeClass('active');
      $(this).addClass('active');
    });

    $(window).on('resize', function () {
      if (window.innerWidth >= MOBILE) { $list.removeAttr('style'); $toggle.attr('aria-expanded', 'false'); }
      $('.drop').removeAttr('style');
    });

    $(window).on('scroll', function () { $('#toTop').toggle(window.scrollY > 600); }).trigger('scroll');
    $('#toTop').on('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    setActive();
  }

  /* ---------- 5. Hero: scrolling car images ---------- */
  function hero() {
    if (!$('#heroCar').length) return;
    var slides = DB.slides.filter(function (s) { return carOf(s.car); });
    var i = 0, timer = null, paused = false;
    var $hero = $('#home'), $car = $('#heroCar'), $dots = $('#heroDots');

    slides.forEach(function (s, n) {
      $dots.append('<button role="tab" aria-label="Show ' + esc(s.title) + '" data-i="' + n + '"></button>');
    });

    function show(n, first) {
      i = (n + slides.length) % slides.length;
      var s = slides[i], car = carOf(s.car);
      $dots.children().attr('aria-selected', 'false').eq(i).attr('aria-selected', 'true');
      var paint = function () {
        $('#heroBrand').text(brandOf(car.brand).name + ' | ' + catOf(car.category).name);
        $('#heroTitle').text(s.title);
        $('#heroLine').text(s.line);
        $('#heroDetails').data('car', car.id);
        $car.removeClass('has-photo').html(CarArt.visual(car)).addClass('enter');
        $car[0].offsetWidth; // restart transition
        $car.removeClass('enter');
        $hero.removeClass('is-changing');
      };
      if (first) { paint(); return; }
      $hero.addClass('is-changing');
      $car.addClass('leave');
      setTimeout(function () { $car.removeClass('leave'); paint(); }, 450);
    }

    function start() { stop(); if (!paused) timer = setInterval(function () { show(i + 1); }, 5500); }
    function stop() { clearInterval(timer); }

    $('#heroNext').on('click', function () { show(i + 1); start(); });
    $('#heroPrev').on('click', function () { show(i - 1); start(); });
    $dots.on('click', 'button', function () { show($(this).data('i')); start(); });
    $('#heroPause').on('click', function () {
      paused = !paused;
      $(this).text(paused ? 'Play' : 'Pause').attr('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      paused ? stop() : start();
    });
    $hero.on('mouseenter', stop).on('mouseleave', start);
    $('#heroDetails').on('click', function () { openCar($(this).data('car')); });

    show(0, true);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();

    // Brand rail under the hero
    $('#brandRail').html(DB.brands.map(function (b) {
      return '<a href="showroom.html?brand=' + b.id + '">' + esc(b.short) + '</a>';
    }).join(''));
  }

  /* ---------- 6. Showroom: brand-wise + performance-wise ---------- */
  var state = { view: 'brand', filter: 'all', q: '', sort: 'price-asc' };

  function setView(view) {
    state.view = view;
    state.filter = 'all';
    renderShowroom();
  }

  function renderShowroom() {
    $('.switch-btn').each(function () {
      var on = $(this).data('view') === state.view;
      $(this).toggleClass('is-on', on).attr('aria-selected', String(on));
    });

    var key = state.view === 'brand' ? 'brand' : 'category';
    var groups = state.view === 'brand' ? DB.brands : DB.categories;
    var chips = '<button class="chip' + (state.filter === 'all' ? ' is-on' : '') + '" data-f="all">All cars<span class="count">' + DB.cars.length + '</span></button>';
    groups.forEach(function (g) {
      var n = DB.cars.filter(function (c) { return c[key] === g.id; }).length;
      chips += '<button class="chip' + (state.filter === g.id ? ' is-on' : '') + '" data-f="' + g.id + '" aria-pressed="' + (state.filter === g.id) + '">' +
        esc(g.short || g.name) + '<span class="count">' + n + '</span></button>';
    });
    $('#chips').html(chips);

    var note = '';
    if (state.filter !== 'all') {
      var g = groups.find(function (x) { return x.id === state.filter; });
      note = state.view === 'brand'
        ? '<strong>' + esc(g.name) + '</strong> from ' + esc(g.country) + '. ' + esc(g.tagline)
        : '<strong>' + esc(g.name) + '.</strong> ' + esc(g.desc);
    }
    $('#groupNote').html(note);

    var q = state.q.toLowerCase();
    var list = DB.cars.filter(function (c) {
      if (state.filter !== 'all' && c[key] !== state.filter) return false;
      if (!q) return true;
      var hay = [c.name, brandOf(c.brand).name, catOf(c.category).name, c.specs.fuel, c.dealer.city].concat(c.features).join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });

    var sorters = {
      'price-asc': function (a, b) { return a.price - b.price; },
      'price-desc': function (a, b) { return b.price - a.price; },
      'power-desc': function (a, b) { return hp(b) - hp(a); },
      'name-asc': function (a, b) { return a.name.localeCompare(b.name); }
    };
    list.sort(sorters[state.sort]);

    if (!list.length) {
      $('#carGrid').html('<div class="empty"><p>No cars match these filters.</p><button class="btn-signal" id="clearFilters">Show all cars</button></div>');
      return;
    }

    $('#carGrid').html(list.map(cardHTML).join(''));
  }

  function cardHTML(c) {
      return '<article class="car-card">' +
        '<button class="pic" data-car="' + c.id + '" aria-label="View details of ' + esc(c.name) + '">' + CarArt.visual(c) + '</button>' +
        '<div class="info">' +
        '<span class="tag ' + c.category + '">' + esc(catOf(c.category).name) + '</span>' +
        '<p class="make">' + esc(brandOf(c.brand).name) + ' | ' + esc(c.dealer.city) + '</p>' +
        '<h3>' + esc(c.name.replace(brandOf(c.brand).name + ' ', '')) + '</h3>' +
        '<p class="price">' + money(c.price) + '</p>' +
        '<ul class="spec-line"><li><strong>' + esc(c.specs.power) + '</strong></li><li>0-100 in <strong>' + esc(c.specs.acceleration) + '</strong></li><li><strong>' + esc(c.specs.fuel) + '</strong></li></ul>' +
        '<div class="more"><button class="link-btn" data-car="' + c.id + '">View details</button></div>' +
        '</div></article>';
  }

  // Home page: featured cars, stats, performance tiles and showrooms
  function featured() {
    if (!$('#featuredGrid').length) return;
    $('#featuredGrid').html(DB.slides.map(function (s) { return carOf(s.car); }).filter(Boolean).map(cardHTML).join(''));

    $('#homeStats').html(DB.company.stats.concat([{ value: String(DB.cars.length), label: 'cars in stock' }]).map(function (s) {
      return '<div><dt>' + esc(s.value) + '</dt><dd>' + esc(s.label) + '</dd></div>';
    }).join(''));

    $('#catTiles').html(DB.categories.map(function (g) {
      var cars = DB.cars.filter(function (c) { return c.category === g.id; });
      var from = Math.min.apply(null, cars.map(function (c) { return c.price; }));
      var pic = cars.slice().sort(function (a, b) { return b.price - a.price; })[0];
      return '<a class="cat-tile" href="showroom.html?category=' + g.id + '">' +
        '<span class="cat-pic">' + (pic ? CarArt.visual(pic) : '') + '</span>' +
        '<span class="cat-body"><strong>' + esc(g.name) + '</strong><span>' + esc(g.desc) + '</span>' +
        '<em>' + cars.length + ' cars from ' + money(from) + '</em></span></a>';
    }).join(''));

    $('#homeShowrooms').html(DB.company.showrooms.map(function (r) {
      var n = DB.cars.filter(function (c) { return c.dealer.city === r.city; }).length;
      return '<div class="home-room"><h3>' + esc(r.city) + '</h3><p>' + esc(r.address) + '</p>' +
        '<p><a href="tel:' + r.phone.replace(/\s/g, '') + '">' + esc(r.phone) + '</a></p>' +
        '<p class="room-count">' + n + ' cars on the floor now</p></div>';
    }).join(''));
  }

  function showroom() {
    $(document).on('click', '[data-car]', function () { openCar($(this).data('car')); });
    if (!$('#carGrid').length) return;
    // Links from other pages: showroom.html?view=category, ?brand=bmw, ?category=electric
    if (param('view') === 'category' || param('category')) state.view = 'category';
    if (param('brand') && DB.brands.some(function (b) { return b.id === param('brand'); })) { state.view = 'brand'; state.filter = param('brand'); }
    if (param('category') && DB.categories.some(function (c) { return c.id === param('category'); })) state.filter = param('category');
    $('.switch-btn').on('click', function () { setView($(this).data('view')); });
    $('#chips').on('click', '.chip', function () { state.filter = $(this).data('f'); renderShowroom(); });
    $('#carSearch').on('input', function () { state.q = $.trim(this.value); renderShowroom(); });
    $('#carSort').on('change', function () { state.sort = this.value; renderShowroom(); });
    $('#carGrid').on('click', '#clearFilters', function () {
      state.filter = 'all'; state.q = ''; $('#carSearch').val(''); renderShowroom();
    });
    renderShowroom();
  }

  /* ---------- 7. Popup with car details ---------- */
  var modal;
  function openCar(id) {
    var c = carOf(id);
    if (!c || !$('#carModal').length) return;
    var b = brandOf(c.brand);
    var w = DB.warranty.find(function (x) { return x.brand === c.brand; });
    var s = c.specs;
    var rows = [['Engine', s.engine], ['Power', s.power], ['Torque', s.torque], ['0-100 km/h', s.acceleration],
      ['Top speed', s.topSpeed], ['Fuel', s.fuel], ['Gearbox', s.transmission],
      [s.fuel === 'Electric' ? 'Range' : 'Fuel economy', s.economy], ['Seats', s.seats], ['Model year', c.year]];

    $('#carModalBrand').text(b.name + ' | ' + catOf(c.category).name);
    $('#carModalTitle').text(c.name);
    $('#carModalBody').html(
      '<div class="modal-grid"><div>' +
      '<div class="modal-visual">' + CarArt.visual(c) + '</div>' +
      '<p class="modal-price">' + money(c.price) + '<small>Ex-showroom price, registration and insurance extra</small></p>' +
      '<h3 class="modal-sub">Features</h3><ul class="feature-list">' + c.features.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '</div><div>' +
      '<h3 class="modal-sub mt-0">Specifications</h3><table class="spec-table"><tbody>' +
      rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') +
      (w ? '<tr><th scope="row">Warranty</th><td>' + w.years + ' years / ' + esc(w.km) + '</td></tr>' : '') +
      '</tbody></table>' +
      '<div class="dealer-box"><h4>Available at ' + esc(c.dealer.name) + '</h4>' +
      '<p>' + esc(c.dealer.address) + '</p><p><a href="tel:' + c.dealer.phone.replace(/\s/g, '') + '">' + esc(c.dealer.phone) + '</a></p></div>' +
      '<div class="modal-actions">' +
      '<button class="btn-signal" data-go="contact" data-id="' + c.id + '">Book a test drive</button>' +
      '<button class="btn-ghost" data-go="calculator" data-id="' + c.id + '">Work out finance</button>' +
      '</div></div></div>'
    );
    modal = modal || new bootstrap.Modal('#carModal');
    modal.show();
  }

  function modalActions() {
    $('#carModalBody').on('click', '[data-go]', function () {
      var go = $(this).data('go'), id = $(this).data('id');
      location.href = go === 'contact' ? 'contact.html?car=' + id : 'finance.html?car=' + id + '#calculator';
    });
  }

  /* ---------- 8. Warranty by brand ---------- */
  function warranty() {
    if (!$('#warrantyPicker').length) return;
    var $picker = $('#warrantyPicker');
    $picker.html(DB.brands.map(function (b) {
      return '<button role="tab" data-b="' + b.id + '" aria-selected="false">' + esc(b.short) + '</button>';
    }).join(''));

    $('#warrantyTable').html(
      '<thead><tr><th>Brand</th><th>Cover</th><th>Distance</th><th>Roadside help</th><th>Paint</th><th>EV battery</th><th>Servicing</th><th>Extended cover</th></tr></thead><tbody>' +
      DB.warranty.map(function (w) {
        return '<tr data-b="' + w.brand + '"><td><strong>' + esc(brandOf(w.brand).short) + '</strong></td><td>' + w.years + ' years</td><td>' + esc(w.km) +
          '</td><td>' + esc(w.roadside) + '</td><td>' + esc(w.paint) + '</td><td>' + esc(w.battery) + '</td><td>' + esc(w.service) + '</td><td>' + esc(w.extended) + '</td></tr>';
      }).join('') + '</tbody>'
    );

    function pick(id) {
      var w = DB.warranty.find(function (x) { return x.brand === id; });
      var models = DB.cars.filter(function (c) { return c.brand === id; }).map(function (c) { return c.name; }).join(', ');
      $picker.children().attr('aria-selected', 'false').filter('[data-b="' + id + '"]').attr('aria-selected', 'true');
      $('#warrantyTable tbody tr').removeClass('is-on').filter('[data-b="' + id + '"]').addClass('is-on');
      $('#warrantyCard').hide().html(
        '<div><p class="w-headline">' + w.years + ' years<span>' + (w.km === 'Unlimited' ? 'Unlimited mileage' : esc(w.km)) + ', manufacturer warranty</span></p></div>' +
        '<dl class="w-list"><dt>Roadside help</dt><dd>' + esc(w.roadside) + '</dd><dt>Paint and rust</dt><dd>' + esc(w.paint) +
        '</dd><dt>EV battery</dt><dd>' + esc(w.battery) + '</dd><dt>Servicing</dt><dd>' + esc(w.service) +
        '</dd><dt>Extended cover</dt><dd>' + esc(w.extended) + '</dd><dt>Models covered</dt><dd>' + esc(models) + '</dd></dl>'
      ).fadeIn(250);
    }
    $picker.on('click', 'button', function () { pick($(this).data('b')); });
    pick(DB.brands[0].id);
  }

  /* ---------- 9. Finance schemes + calculator ---------- */
  function eligible(scheme, car) {
    if (scheme.brands.indexOf(car.brand) === -1) return false;
    if (scheme.electricOnly && car.specs.fuel !== 'Electric') return false;
    return true;
  }

  function finance() {
    if (!$('#calcCar').length) return;
    var brandFilter = 'all';

    function renderChips() {
      var html = '<button class="chip' + (brandFilter === 'all' ? ' is-on' : '') + '" data-b="all">All brands</button>';
      DB.brands.forEach(function (b) {
        html += '<button class="chip' + (brandFilter === b.id ? ' is-on' : '') + '" data-b="' + b.id + '">' + esc(b.short) + '</button>';
      });
      $('#financeChips').html(html);
    }

    function renderSchemes() {
      var list = DB.finance.filter(function (f) { return brandFilter === 'all' || f.brands.indexOf(brandFilter) > -1; });
      $('#schemeList').html(list.map(function (f) {
        var models = DB.cars.filter(function (c) { return eligible(f, c) && (brandFilter === 'all' || c.brand === brandFilter); });
        return '<article class="scheme">' +
          '<div class="scheme-top"><h3>' + esc(f.name) + '</h3><span class="rate">' + f.rate + '%<small> p.a.</small></span></div>' +
          '<p class="type">' + esc(f.type) + '</p>' +
          '<dl class="terms"><div><dt>Down payment</dt><dd>From ' + f.minDown + '%</dd></div><div><dt>Tenure</dt><dd>' + f.tenure[0] + ' to ' + f.tenure[f.tenure.length - 1] + ' years</dd></div>' +
          (f.balloon ? '<div><dt>Balloon</dt><dd>' + f.balloon + '%</dd></div>' : '') + '</dl>' +
          '<ul>' + f.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
          '<p class="brands"><strong>' + models.length + ' eligible models.</strong> ' + (brandFilter === 'all'
            ? 'Brands: ' + esc(f.brands.map(function (id) { return brandOf(id).short; }).join(', ')) + (f.electricOnly ? ' (electric models only)' : '')
            : esc(models.map(function (c) { return c.name; }).join(', '))) + '</p>' +
          '<button class="link-btn use-plan" data-plan="' + f.id + '" data-first="' + (models[0] ? models[0].id : '') + '">Use this plan in the calculator</button>' +
          '</article>';
      }).join('') || '<div class="empty">No finance plans for this brand yet. Call us to discuss options.</div>');
    }

    $('#financeChips').on('click', '.chip', function () { brandFilter = $(this).data('b'); renderChips(); renderSchemes(); });
    $('#schemeList').on('click', '.use-plan', function () {
      var car = $(this).data('first'), plan = $(this).data('plan');
      if (car) $('#calcCar').val(car).trigger('change');
      $('#calcScheme').val(plan).trigger('change');
      document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    });

    // Calculator
    $('#calcCar').html(DB.brands.map(function (b) {
      return '<optgroup label="' + esc(b.name) + '">' + DB.cars.filter(function (c) { return c.brand === b.id; }).map(function (c) {
        return '<option value="' + c.id + '">' + esc(c.name) + ' (' + money(c.price) + ')</option>';
      }).join('') + '</optgroup>';
    }).join(''));

    function fillSchemes() {
      var car = carOf($('#calcCar').val());
      var keep = $('#calcScheme').val();
      var ok = DB.finance.filter(function (f) { return eligible(f, car); });
      $('#calcScheme').html(ok.map(function (f) { return '<option value="' + f.id + '">' + esc(f.name) + ' (' + f.rate + '%)</option>'; }).join(''));
      if (ok.some(function (f) { return f.id === keep; })) $('#calcScheme').val(keep);
      fillTerms();
    }

    function fillTerms() {
      var f = DB.finance.find(function (x) { return x.id === $('#calcScheme').val(); });
      var keep = $('#calcTenure').val();
      $('#calcTenure').html(f.tenure.map(function (t) { return '<option value="' + t + '">' + t + (t === 1 ? ' year' : ' years') + '</option>'; }).join(''));
      $('#calcTenure').val(f.tenure.indexOf(+keep) > -1 ? keep : f.tenure[f.tenure.length - 1]);
      var $down = $('#calcDown').attr('min', f.minDown);
      if (+$down.val() < f.minDown) $down.val(f.minDown);
      calc();
    }

    function calc() {
      var car = carOf($('#calcCar').val());
      var f = DB.finance.find(function (x) { return x.id === $('#calcScheme').val(); });
      var downPct = +$('#calcDown').val();
      var years = +$('#calcTenure').val();
      var price = car.price, down = price * downPct / 100, principal = price - down;
      var balloon = f.balloon ? price * f.balloon / 100 : 0;
      var r = f.rate / 1200, n = years * 12;
      var monthly = (principal - balloon / Math.pow(1 + r, n)) * r / (1 - Math.pow(1 + r, -n));
      var total = down + monthly * n + balloon;

      $('#calcDownOut').text(downPct + '%');
      $('#calcMonthly').text(money(monthly));
      $('#calcBreakdown').html(
        '<dt>Car price</dt><dd>' + money(price) + '</dd>' +
        '<dt>Down payment</dt><dd>' + money(down) + '</dd>' +
        '<dt>Financed amount</dt><dd>' + money(principal) + '</dd>' +
        (balloon ? '<dt>Final balloon payment</dt><dd>' + money(balloon) + '</dd>' : '') +
        '<dt>' + n + ' monthly payments</dt><dd>' + money(monthly * n) + '</dd>' +
        '<dt>Total you pay</dt><dd>' + money(total) + '</dd>' +
        '<dt>Cost of finance</dt><dd>' + money(total - price) + '</dd>'
      );
    }

    $('#calcCar').on('change', fillSchemes);
    $('#calcScheme').on('change', fillTerms);
    $('#calcTenure').on('change', calc);
    $('#calcDown').on('input', calc);

    if (carOf(param('car'))) $('#calcCar').val(param('car'));
    renderChips();
    renderSchemes();
    fillSchemes();
  }

  /* ---------- 10. Gallery + lightbox ---------- */
  function gallery() {
    if (!$('#galleryGrid').length) return;
    var items = DB.gallery.filter(function (g) { return carOf(g.car); });
    var at = 0, lb;
    $('#galleryGrid').html(items.map(function (g, i) {
      return '<button class="gallery-item" data-i="' + i + '"><figure class="m-0"><div class="frame">' +
        CarArt.visual(carOf(g.car)) + '</div><figcaption>' + esc(g.caption) + '</figcaption></figure></button>';
    }).join(''));

    function show(i) {
      at = (i + items.length) % items.length;
      var g = items[at];
      $('#lightboxFigure').hide().html(CarArt.visual(carOf(g.car)) + '<figcaption>' + esc(g.caption) + ' (' + (at + 1) + ' of ' + items.length + ')</figcaption>').fadeIn(200);
    }
    $('#galleryGrid').on('click', '.gallery-item', function () {
      show($(this).data('i'));
      lb = lb || new bootstrap.Modal('#lightbox');
      lb.show();
    });
    $('#lbPrev').on('click', function () { show(at - 1); });
    $('#lbNext').on('click', function () { show(at + 1); });
    $('#lightbox').on('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* ---------- 11. About us ---------- */
  function about() {
    var c = DB.company;
    $('#aboutText').html(c.about.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
      '<p>We sell ' + DB.brands.map(function (b) { return b.name; }).join(', ') + '.</p>');
    $('#aboutStats').html(c.stats.map(function (s) { return '<div><dt>' + esc(s.value) + '</dt><dd>' + esc(s.label) + '</dd></div>'; }).join(''));
    $('#showroomList').html(c.showrooms.map(function (s) {
      return '<li><strong>' + esc(s.city) + '</strong>' + esc(s.address) + '<br><a href="tel:' + s.phone.replace(/\s/g, '') + '">' + esc(s.phone) + '</a></li>';
    }).join(''));
  }

  /* ---------- 12. Contact form ---------- */
  function prefillEnquiry(id) {
    var c = carOf(id);
    if (!c) return;
    $('#cCar').val(id);
    if (!$('#cMsg').val()) $('#cMsg').val('I would like to book a test drive of the ' + c.name + ' at ' + c.dealer.name + '.');
  }

  function contact() {
    $('#cCar').html('<option value="">Not sure yet</option>' + DB.cars.map(function (c) {
      return '<option value="' + c.id + '">' + esc(c.name) + '</option>';
    }).join(''));

    var rules = {
      cName: function (v) { return v.length >= 3; },
      cPhone: function (v) { var d = v.replace(/\D/g, ''); return d.length >= 10 && d.length <= 13; },
      cEmail: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
      cMsg: function (v) { return v.length >= 10; }
    };
    function check(id) {
      var ok = rules[id]($.trim($('#' + id).val()));
      $('#' + id).toggleClass('is-bad', !ok).attr('aria-invalid', String(!ok));
      $('.err[data-for="' + id + '"]').toggleClass('show', !ok);
      return ok;
    }
    Object.keys(rules).forEach(function (id) {
      $('#' + id).on('blur', function () { check(id); }).on('input', function () { if ($(this).hasClass('is-bad')) check(id); });
    });

    if (param('car')) prefillEnquiry(param('car'));

    $('#contactForm').on('submit', function (e) {
      e.preventDefault();
      var bad = Object.keys(rules).filter(function (id) { return !check(id); });
      if (bad.length) { $('#' + bad[0]).trigger('focus'); $('#formOk').text(''); return; }
      var entry = {};
      $(this).serializeArray().forEach(function (f) { entry[f.name] = f.value; });
      entry.sentAt = new Date().toISOString();
      var all = [];
      try { all = JSON.parse(store('carrio_enquiries') || '[]'); } catch (err) { all = []; }
      all.push(entry);
      store('carrio_enquiries', JSON.stringify(all));
      $('#formOk').hide().text('Thank you, ' + entry.name.split(' ')[0] + '. Your enquiry was sent. Our team will call you within one working day.').fadeIn(250);
      this.reset();
    });
  }

  /* ---------- 13. Site map ---------- */
  function sitemap() {
    if (!$('#sitemapGrid').length) return;
    var tree = [
      { t: 'Home', h: 'index.html', c: DB.slides.map(function (s) { return [s.title, 'index.html']; }).concat([['Featured cars', 'index.html#featured']]) },
      { t: 'Showroom', h: 'showroom.html', c: [['Cars by brand', 'showroom.html?view=brand'], ['Cars by performance', 'showroom.html?view=category']] },
      { t: 'Brands', h: 'showroom.html', c: DB.brands.map(function (b) { return [b.name, 'showroom.html?brand=' + b.id]; }) },
      { t: 'Performance', h: 'showroom.html?view=category', c: DB.categories.map(function (c) { return [c.name, 'showroom.html?category=' + c.id]; }) },
      { t: 'Warranty', h: 'warranty.html', c: [['Warranty by brand', 'warranty.html'], ['Compare all brands', 'warranty.html']] },
      { t: 'Finance', h: 'finance.html', c: DB.finance.map(function (f) { return [f.name, 'finance.html']; }).concat([['Payment calculator', 'finance.html#calculator']]) },
      { t: 'More pages', h: 'gallery.html', c: [['Gallery', 'gallery.html'], ['About us', 'about.html'], ['Contact us', 'contact.html'], ['Site map', 'sitemap.html']] }
    ];
    $('#sitemapGrid').html(tree.map(function (s) {
      return '<div><h3><a href="' + s.h + '">' + s.t + '</a></h3><ul>' + s.c.map(function (l) {
        return '<li><a href="' + l[1] + '">' + esc(l[0]) + '</a></li>';
      }).join('') + '</ul></div>';
    }).join(''));
  }

  /* ---------- 14. Ticker: date, time, location (HTML5 geolocation) ---------- */
  function ticker() {
    var group = '<div class="ticker-group">' +
      '<span class="ticker-item"><b>Date</b><span class="t-date"></span></span>' +
      '<span class="ticker-item"><b>Time</b><span class="t-time"></span></span>' +
      '<span class="ticker-item"><b>Your location</b><span class="t-loc">Finding your location...</span></span>' +
      '<span class="ticker-item"><b>Showrooms</b>Karachi, Lahore and Islamabad</span>' +
      '<span class="ticker-item"><b>Green EV Plan</b>11% finance on electric cars with a free home charger</span>' +
      '</div>';
    $('#tickerTrack').html(group + group);

    function tick() {
      var now = new Date();
      $('.t-date').text(now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      $('.t-time').text(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    tick();
    setInterval(tick, 1000);

    function setLoc(t, keep) {
      $('.t-loc').text(t);
      if (keep) { try { sessionStorage.setItem('carrio_loc', t); } catch (e) { /* ignore */ } }
    }
    // Reuse the location found on an earlier page of this visit
    var saved = null;
    try { saved = sessionStorage.getItem('carrio_loc'); } catch (e) { /* ignore */ }
    if (saved) { setLoc(saved); return; }

    if (!('geolocation' in navigator)) { setLoc('Location is not supported by this browser'); return; }
    navigator.geolocation.getCurrentPosition(function (pos) {
      var lat = pos.coords.latitude, lon = pos.coords.longitude;
      var coords = Math.abs(lat).toFixed(3) + '°' + (lat >= 0 ? 'N' : 'S') + ', ' + Math.abs(lon).toFixed(3) + '°' + (lon >= 0 ? 'E' : 'W');
      setLoc(coords, true);
      // City name: only when served over http(s) and online (blocked for file:// pages)
      if (!/^https?:$/.test(location.protocol) || !navigator.onLine) return;
      $.getJSON('https://nominatim.openstreetmap.org/reverse', { format: 'json', lat: lat, lon: lon, zoom: 10 })
        .done(function (r) {
          var a = r && r.address;
          if (a) setLoc([a.city || a.town || a.village || a.county, a.country].filter(Boolean).join(', ') + ' (' + coords + ')', true);
        });
    }, function (err) {
      setLoc(err.code === 1 ? 'Allow location access to see it here' : 'Location unavailable right now');
    }, { timeout: 10000, maximumAge: 600000 });
  }

  /* ---------- Start ---------- */
  $(function () {
    loadData().done(function (data) {
      DB = data;
      fillCompany();
      visitorCounter();
      menu();
      hero();
      showroom();
      featured();
      modalActions();
      warranty();
      finance();
      gallery();
      about();
      contact();
      sitemap();
      ticker();
    });
  });
})(jQuery);
