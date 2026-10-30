jQuery(function($){

    $(document).ready(function() {

     $('.landing-testimonials .testimonial-slider').slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      slidesToScroll: 1,
      arrow: false,
      autoplay: false,
      autoplaySpeed: 5000,
      nextArrow: $('.landing-testimonials .testimonial-btn'), 
      responsive: [
        {
          breakpoint: 1025,
          settings: {
            slidesToShow: 2
          }
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 1
          }
        }
      ]
    });

     $('.sampler-testimonials .testimonial-slider').slick({
      dots: false,
      infinite: true,
      speed: 300,
      slidesToShow: 3,
      slidesToScroll: 1,
      arrow: false,
      autoplay: false,
      autoplaySpeed: 5000,
      nextArrow: $('.sampler-testimonials .testimonial-btn'), 
      responsive: [
        {
          breakpoint: 1025,
          settings: {
            slidesToShow: 2
          }
        },
        {
          breakpoint: 767,
          settings: {
            slidesToShow: 1
          }
        }
      ]
    });


  });


});  
