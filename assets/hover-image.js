document.addEventListener("DOMContentLoaded", () => {
  // Select all card-product elements in the grid
  const cardProducts = document.querySelectorAll(".card-wrapper")

  // Loop through each card-product
  cardProducts.forEach((cardProduct) => {
    // Select all color spans within the current card-product
    const colorSpans = cardProduct.querySelectorAll(".card__options span")

    if (colorSpans.length > 0) {
      // Select the hover image within the current card-product
      const productImage = cardProduct.querySelector("#hover_image")

      // Store the original image attributes for the current card
      const originalSrc = productImage.src
      const originalSrcset = productImage.srcset
      const originalWidth = productImage.width
      const originalHeight = productImage.height

      // Add mouseenter event listener to each color span in this card-product
      colorSpans.forEach((span) => {
        span.addEventListener("click", () => {
          const imageValue = span.id

          if (imageValue) {
            const parts = imageValue.split("&&").reduce((acc, part) => {
              const [key, value] = part.split("=")
              acc[key] = value
              return acc
            }, {})

            const src = parts.src
            const width = parts.width
            const height = parts.height

            const imageWidth =
              width >= 1500
                ? 1500
                : width >= 1066
                ? 1066
                : width >= 940
                ? 940
                : width >= 720
                ? 720
                : width >= 533
                ? 533
                : width >= 360
                ? 360
                : width >= 165 && 165

            productImage.src = `/cdn/shop/${src}?v=1728136859&width=72`
            productImage.srcset = `/cdn/shop/${src}?v=1728136859&width=${imageWidth} ${imageWidth}w`
            productImage.width = width
            productImage.height = height
          }
        })
      })

      // Add mouseleave event listener to reset the image when mouse exits the card-product
      cardProduct.addEventListener("mouseleave", () => {
        productImage.src = originalSrc
        productImage.srcset = originalSrcset
        productImage.width = originalWidth
        productImage.height = originalHeight
      })
    }
  })
})
