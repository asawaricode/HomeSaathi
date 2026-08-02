(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false,
    );
  });
})();

// Debounced Search — auto-submits the search form 400ms after the user stops typing.
// Manual submit (pressing Enter or the Search button) still fires immediately.
(function () {
  const searchInput = document.querySelector(".search-input");
  if (!searchInput) return; // not on a page with the search bar

  const searchForm = searchInput.closest("form");
  let debounceTimer = null;

  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      searchForm.submit();
    }, 400);
  });
})();

