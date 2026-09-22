CARRIO MOTORS - Multi-page responsive website (Aptech eProject)
==============================================================

HOW TO RUN
1. Unzip the folder.
2. Double-click index.html (works offline, in Chrome, Edge, Firefox or Safari).
   Recommended: open the folder in VS Code and use "Live Server", so the site
   reads the JSON files in /data directly and location works on http://localhost.
No internet, database or installation is needed. Bootstrap, jQuery and fonts are included.

TECHNOLOGIES
HTML5, CSS3, Bootstrap 5.3, JavaScript, jQuery 3.7, JSON (data store), XML (sitemap.xml), SVG.

FOLDER STRUCTURE
index.html              Home page (slider, stats, featured cars, performance groups, offer, showrooms)
showroom.html           Cars by brand and by performance, car popup
warranty.html           Warranty by brand
finance.html            Finance plans and payment calculator
gallery.html            Gallery with lightbox
about.html              About us
contact.html            Contact us and enquiry form
sitemap.html            Site map
assets/css/style.css    All custom styling and responsive rules
assets/js/app.js        All features, shared by every page (menu, slider, showroom, popup, warranty, finance, gallery, form, ticker, visitor count)
assets/js/car-art.js    Draws car pictures in SVG
assets/vendor/          Bootstrap and jQuery (local copies)
assets/fonts/           Barlow and Barlow Condensed fonts
data/*.json             Data store: cars, brands, categories, warranty, finance, company, slides, gallery
data/data-fallback.js   Copy of the JSON used when index.html is opened directly from disk
images/                 Logo; real car photos go in images/cars as <car-id>.jpg (list inside)
sitemap.xml             XML site map
screenshots/            Images used in README.md (for GitHub)
README.md               Project description for GitHub

REQUIREMENTS COVERED
- Logo and scrolling car images at the top (auto slider with pause, arrows and dots)
- Brand-wise categories (BMW, Audi, Hyundai, Jeep, Suzuki, Kia, MG)
- Performance-wise categories (City & fuel efficient, Family, Luxury, Sport, Off-road, Electric)
- Menu with every function; colour changes on hover and after click; drop-downs fade in and out
- Click a car picture: popup with specifications, features, price, dealer location and warranty
- Warranty schemes, different for each brand, plus a comparison table
- Finance schemes for different models and brands, plus a monthly payment calculator
- Site map, Gallery (with lightbox), About us, Contact us (email, address, phone); contact details also in every footer
- Scrolling ticker at the bottom with current date, time and location (HTML5 Geolocation)
- Visitor count at the top right beside the logo image
- Extra: search, sorting, enquiry / test drive form with validation, back-to-top button
- Responsive for mobile, tablet and desktop; keyboard accessible; respects reduced motion

NOTES / ASSUMPTIONS
- Prices, specifications and plans are sample data for the project.
- Visitor count is stored in the browser (localStorage), counted once per visit, added to a base figure.
- Enquiries from the contact form are saved in the browser (localStorage key "carrio_enquiries").
- Location shows coordinates; the city name appears when online (OpenStreetMap).
- If data/*.json is edited, data/data-fallback.js must be updated too for file:// use.
