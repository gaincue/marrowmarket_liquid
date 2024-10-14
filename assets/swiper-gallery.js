document.addEventListener("DOMContentLoaded", function () {
  const swiperEl = document.querySelector("swiper-container");
  const verticalThumbsEl = document.querySelector(
    ".product-media-vertical-thumbs"
  );
  const announcementHeight = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--announcement-height");
  const headerHeight = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--header-height");
  const paddingTop = getComputedStyle(
    document.documentElement
  ).getPropertyValue("--product-info-padding");

  if (swiperEl != null) {
    Object.assign(swiperEl, {
      direction: "horizontal",
      pagination: {
        enabled: false,
      },
      slidesPerView: 1,
      scrollbar: {
        enabled: true,
      },
      breakpoints: {
        750: {
          enabled: false,
          direction: "vertical",
          slidesPerView: "auto",
        },
      },
    });

    swiperEl.initialize();

    let activeIndex = 0;
    let slideTops = [];

    function updateSlideTops() {
      slideTops = Array.from(swiperEl.swiper.slides).map(
        (slide) => slide.offsetTop
      );
      calculateTotalHeight();
    }

    function calculateTotalHeight() {
      totalHeight = Array.from(swiperEl.swiper.slides).reduce(
        (sum, slide) => sum + slide.offsetHeight,
        0
      );

      if (verticalThumbsEl) {
        verticalThumbsEl.style.height = `${
          totalHeight -
          parseFloat(announcementHeight) -
          parseFloat(headerHeight) -
          parseFloat(paddingTop)
        }px`;
        console.log(
          "Updated .product-media-vertical-thumbs height:",
          totalHeight
        );
      }
    }

    function handleScroll() {
      const scrollPosition = window.scrollY;

      // Find the index of the first slide that starts below the current scroll position
      const newIndex = slideTops.findIndex((top) => top > scrollPosition);

      // If all slides are above the scroll position, select the last slide
      const correctedIndex =
        newIndex === -1 ? slideTops.length - 1 : newIndex - 1;

      if (
        correctedIndex !== activeIndex &&
        correctedIndex >= 0 &&
        correctedIndex < swiperEl.swiper.slides.length
      ) {
        activeIndex = correctedIndex;
        console.log("Active Index:", activeIndex);
        // swiperEl.swiper.slideTo(activeIndex, 0, false)
        const allThumbs = document.querySelectorAll(
          `.product-media-vertical-thumbs button[data-index]`
        );

        if (allThumbs.length > 0) {
          allThumbs.forEach((button, index) => {
            button.classList.add("twcss-bg-skin");
            button.classList.remove("twcss-bg-charcoal");
          });
        }

        document
          .querySelector(
            `.product-media-vertical-thumbs button[data-index="${activeIndex}"]`
          )
          .classList.remove("twcss-bg-skin");
        document
          .querySelector(
            `.product-media-vertical-thumbs button[data-index="${activeIndex}"]`
          )
          .classList.add("twcss-bg-charcoal");
      }
    }

    // Update slide tops when window is resized
    window.addEventListener("resize", updateSlideTops);

    // Initial update of slide tops
    updateSlideTops();

    // Attach scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Update slide tops when Swiper updates
    swiperEl.swiper.on("imagesReady", updateSlideTops);
    swiperEl.swiper.on("breakpoint", updateSlideTops);
  }
});
