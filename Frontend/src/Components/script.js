import TiktokPixel from 'tiktok-pixel';

// Initialize TikTok Pixel
TiktokPixel.init('D54GNSJC77UAQNS9HE5G'); 

// Track page view
TiktokPixel.pageView(); // <-- use this instead of pageLoad


export function loadGTM() {
  (function(w,d,s,l,i){
    w[l]=w[l]||[];
    w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
    var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
    j.async=true;
    j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-KZ3F2KQD');
}


export {
    TiktokPixel,
    
};