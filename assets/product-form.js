if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.variantIdInput.disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector("span");

        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.hideErrors = this.dataset.hideErrors === "true";
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".loading__spinner").classList.remove("hidden");

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);

        // Handle engraving variant switch before submitting
        const engravingInput = this.form.querySelector('[name="properties[Engraving]"]');
        if (engravingInput?.value) {
          const engravingVariantId = this.findEngravingVariantId();
          if (engravingVariantId) {
            // Update the variant ID to the engraving variant
            formData.set('id', engravingVariantId);
            console.log('[Engraving] Switched to engraving variant:', engravingVariantId);
          } else {
            console.warn('[Engraving] No engraving variant found - using original variant');
          }
        }

        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButtonText.classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;
              return;
            }

            return response;
          })
          .then((response) => {
            if (!response) return;

            if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: "product-form",
                productVariantId: formData.get("id"),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest("quick-add-modal");
            if (quickAddModal) {
              document.body.addEventListener(
                "modalClosed",
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("aria-disabled");
            this.querySelector(".loading__spinner").classList.add("hidden");
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute("disabled", "disabled");
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute("disabled");
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      /**
       * Find the engraving variant ID based on the current variant
       * Option B: Engraving is a separate product option (e.g., Color: Red, Engraving: Yes)
       * Looks for a variant with the same base options but with 'Yes' for the Engraving option
       * @returns {number|null} The engraving variant ID or null if not found
       */
      findEngravingVariantId() {
        try {
          // Get the variant data from the JSON script tag
          const variantDataScript = this.form.querySelector('[data-engraving-variants]');
          if (!variantDataScript) {
            console.log('[Engraving] No variant data found');
            return null;
          }

          const variantData = JSON.parse(variantDataScript.textContent);
          const variants = variantData.variants;
          const options = variantData.options || [];

          // Get the currently selected variant ID
          const currentVariantId = parseInt(this.variantIdInput.value, 10);

          // Find the current variant
          const currentVariant = variants.find(v => v.id === currentVariantId);
          if (!currentVariant) {
            console.log('[Engraving] Current variant not found:', currentVariantId);
            return null;
          }

          console.log('[Engraving] Current variant:', currentVariant.title);
          console.log('[Engraving] Options:', options);

          // Find which option position is the Engraving option
          const engravingOptionIndex = options.findIndex(opt =>
            opt.toLowerCase() === 'engraving' ||
            opt.toLowerCase() === 'personalisation' ||
            opt.toLowerCase() === 'personalization'
          );

          if (engravingOptionIndex === -1) {
            console.log('[Engraving] No Engraving option found in product options');
            return null;
          }

          const optionKey = `option${engravingOptionIndex + 1}`; // option1, option2, or option3
          console.log('[Engraving] Engraving option position:', optionKey);

          // Check if current variant already has engraving selected
          const currentEngravingValue = currentVariant[optionKey]?.toLowerCase();
          if (currentEngravingValue === 'yes' || currentEngravingValue === 'with engraving') {
            console.log('[Engraving] Current variant already has engraving');
            return currentVariantId; // Already on engraving variant
          }

          // Find the matching variant with engraving = Yes
          const engravingVariant = variants.find(v => {
            if (v.id === currentVariantId) return false;
            if (!v.available) return false;

            // Check if engraving option is 'Yes' or similar
            const engravingValue = v[optionKey]?.toLowerCase();
            if (engravingValue !== 'yes' && engravingValue !== 'with engraving') {
              return false;
            }

            // Check all other options match
            for (let i = 1; i <= 3; i++) {
              const key = `option${i}`;
              if (i === engravingOptionIndex + 1) continue; // Skip the engraving option
              if (v[key] !== currentVariant[key]) return false;
            }

            return true;
          });

          if (engravingVariant) {
            console.log('[Engraving] Found engraving variant:', engravingVariant.title, engravingVariant.id);
            return engravingVariant.id;
          }

          console.log('[Engraving] No engraving variant found for:', currentVariant.title);
          return null;
        } catch (error) {
          console.error('[Engraving] Error finding engraving variant:', error);
          return null;
        }
      }

      get variantIdInput() {
        return this.form.querySelector("[name=id]");
      }
    }
  );
}
