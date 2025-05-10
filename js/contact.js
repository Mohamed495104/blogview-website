"use strict";

/**
 * contact.js
 * Handles the functionality for the contact form page
 */

$(document).ready(function () {
  // Set up event listeners
  setupEventListeners();
});

/**
 * Set up event listeners for the contact page
 */
function setupEventListeners() {
  // Contact method radio button change
  $('input[name="contactMethod"]').on("change", function () {
    const selectedMethod = $('input[name="contactMethod"]:checked').val();

    if (selectedMethod === "phone") {
      // Show phone number input field
      $("#phone-container").removeClass("hidden");
    } else {
      // Hide phone number input field
      $("#phone-container").addClass("hidden");
      // Clear any errors
      $("#phone-error").text("");
    }
  });

  // Contact form submission
  $("#contact-form").on("submit", function (e) {
    e.preventDefault();

    // Validate form
    if (validateContactForm()) {
      // Process form submission
      processContactForm();
    }
  });

  // New message button click
  $("#new-message-btn").on("click", function () {
    // Hide success message and show form again
    $("#success-message").addClass("hidden");
    $("#contact-form")[0].reset();
    $(".contact-form").show();
  });
}

/**
 * Validate the contact form
 * @returns {boolean} - True if the form is valid, false otherwise
 */
function validateContactForm() {
  let isValid = true;

  // Clear previous error messages
  $(".error-message").text("");

  // Name validation
  const name = $("#name").val().trim();
  if (!name) {
    $("#name-error").text("Please enter your name");
    isValid = false;
  }

  // Email validation
  const email = $("#email").val().trim();
  if (!email) {
    $("#email-error").text("Please enter your email address");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $("#email-error").text("Please enter a valid email address");
    isValid = false;
  }

  // Subject validation
  const subject = $("#subject").val().trim();
  if (!subject) {
    $("#subject-error").text("Please enter a subject");
    isValid = false;
  }

  // Message validation
  const message = $("#message").val().trim();
  if (!message) {
    $("#message-error").text("Please enter your message");
    isValid = false;
  } else if (message.length < 20) {
    $("#message-error").text(
      "Your message should be at least 20 characters long"
    );
    isValid = false;
  }

  // Phone validation (only if phone is selected as contact method)
  const contactMethod = $('input[name="contactMethod"]:checked').val();
  if (contactMethod === "phone") {
    const phone = $("#phone").val().trim();
    const phonePattern = /^\d{10}$/;

    if (!phone) {
      $("#phone-error").text("Please enter your phone number");
      isValid = false;
    } else if (!phonePattern.test(phone)) {
      $("#phone-error").text("Please enter a valid 10-digit phone number");
      isValid = false;
    }
  }

  return isValid;
}

/**
 * Process the contact form submission
 */
function processContactForm() {
  // Show loading state
  const submitBtn = $("#submit-btn");
  const originalBtnText = submitBtn.text();
  submitBtn.text("Sending...").prop("disabled", true);

  // Simulate form submission (in a real app, this would be an API call)
  setTimeout(() => {
    // Hide the form
    $(".contact-form").hide();

    // Show success message
    $("#success-message").removeClass("hidden");

    // Reset button
    submitBtn.text(originalBtnText).prop("disabled", false);

    // Reset form (will be hidden but reset for when user wants to send another message)
    $("#contact-form")[0].reset();

    // Reset error messages
    $(".error-message").text("");

    // Hide phone field
    $("#phone-container").addClass("hidden");
  }, 1500);
}
