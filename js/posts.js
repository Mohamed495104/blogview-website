"use strict";

/*
 * Handles the functionality for the blog posts page
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let postsPerPage = 10;
let currentSearchQuery = "";
let currentSortOption = "recent";
let currentTagFilter = "";
let allTags = [];

$(document).ready(function () {
  // Load all tags for the filter dropdown
  loadAllTags();

  // Load initial posts
  loadPosts();

  // Set up event listeners
  setupEventListeners();
});

/**
 * Load all unique tags and populate the tag filter dropdown
 */
async function loadAllTags() {
  try {
    allTags = await dataFunctions.getAllTags();

    // Populate the tag filter dropdown
    const tagSelect = $("#tag-filter");
    allTags.forEach((tag) => {
      tagSelect.append(`<option value="${tag}">${tag}</option>`);
    });
  } catch (error) {
    console.error("Error loading tags:", error);
    showErrorMessage("Failed to load tags for filtering.");
  }
}

/**
 * Load posts with current filters and pagination
 */
async function loadPosts() {
  try {
    // Show loading state
    $("#posts-grid").html('<div class="loading">Loading posts...</div>');

    // Get posts with current filters, sorting, and pagination
    const options = {
      search: currentSearchQuery,
      sortBy: currentSortOption,
      tag: currentTagFilter,
    };

    const postsData = await dataFunctions.getPosts(
      currentPage,
      postsPerPage,
      options
    );

    // Update total pages
    totalPages = postsData.totalPages;

    // Display posts
    displayPosts(postsData.posts);

    // Update pagination
    updatePagination();
  } catch (error) {
    console.error("Error loading posts:", error);
    $("#posts-grid").html(
      "<p>Failed to load posts. Please try again later.</p>"
    );
  }
}

/**
 * Display posts in the grid
 * @param {Array} posts - Array of post objects
 */
function displayPosts(posts) {
  // Clear posts container
  const postsGrid = $("#posts-grid");
  postsGrid.empty();

  if (posts.length === 0) {
    postsGrid.html("<p>No posts found matching your criteria.</p>");
    return;
  }

  // Create and append post cards
  posts.forEach((post) => {
    const postCard = createPostCard(post);
    postsGrid.append(postCard);
  });
}

function createPostCard(post) {
  // Create tags HTML
  const tagsHtml = post.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  // Get reactions count - handle both when it's a number or an object
  const reactionsCount =
    typeof post.reactions === "object"
      ? post.reactions.count || 0
      : post.reactions || 0;

  // Create post card element
  const postCard = $(`
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-content">
                <h3 class="post-title">
                    <a href="post-details.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="post-excerpt">${dataFunctions.truncateText(
                  post.body,
                  150
                )}</p>
                <div class="post-tags">
                    ${tagsHtml}
                </div>
                <div class="post-meta">
                    <span class="post-user">User: ${post.userId}</span>
                    <span class="post-reactions">❤️ ${reactionsCount}</span>
                </div>
            </div>
        </div>
    `);

  return postCard;
}

/**
 * Update pagination controls
 */
function updatePagination() {
  const paginationContainer = $("#pagination");
  paginationContainer.empty();

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return;
  }

  // Previous page button
  const prevButton = $("<button>").text("«").attr("id", "prev-page");
  if (currentPage === 1) {
    prevButton.prop("disabled", true);
  }
  paginationContainer.append(prevButton);

  // Page number buttons (show max 5 pages with current page in the middle)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  // Adjust start page if we're near the end
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = $("<button>").text(i).data("page", i);
    if (i === currentPage) {
      pageButton.addClass("active");
    }
    paginationContainer.append(pageButton);
  }

  // Next page button
  const nextButton = $("<button>").text("»").attr("id", "next-page");
  if (currentPage === totalPages) {
    nextButton.prop("disabled", true);
  }
  paginationContainer.append(nextButton);
}

/**
 * Set up event listeners for the posts page
 */
function setupEventListeners() {
  // Search button click
  $("#search-btn").on("click", function () {
    currentSearchQuery = $("#post-search").val().trim();
    currentPage = 1; // Reset to first page
    loadPosts();
  });

  // Search input enter key
  $("#post-search").on("keypress", function (e) {
    if (e.which === 13) {
      currentSearchQuery = $(this).val().trim();
      currentPage = 1; // Reset to first page
      loadPosts();
    }
  });

  // Tag filter change
  $("#tag-filter").on("change", function () {
    currentTagFilter = $(this).val();
    currentPage = 1; // Reset to first page
    loadPosts();
  });

  // Sort posts change
  $("#sort-posts").on("change", function () {
    currentSortOption = $(this).val();
    currentPage = 1; // Reset to first page
    loadPosts();
  });

  // Pagination: previous page
  $("#pagination").on("click", "#prev-page", function () {
    if (currentPage > 1) {
      currentPage--;
      loadPosts();
      // Scroll to top of posts section
      $("html, body").animate(
        {
          scrollTop: $("#posts-grid").offset().top - 100,
        },
        200
      );
    }
  });

  // Pagination: next page
  $("#pagination").on("click", "#next-page", function () {
    if (currentPage < totalPages) {
      currentPage++;
      loadPosts();
      // Scroll to top of posts section
      $("html, body").animate(
        {
          scrollTop: $("#posts-grid").offset().top - 100,
        },
        200
      );
    }
  });

  // Pagination: specific page
  $("#pagination").on(
    "click",
    "button:not(#prev-page):not(#next-page)",
    function () {
      const pageNum = $(this).data("page");
      if (pageNum !== currentPage) {
        currentPage = pageNum;
        loadPosts();
        // Scroll to top of posts section
        $("html, body").animate(
          {
            scrollTop: $("#posts-grid").offset().top - 100,
          },
          200
        );
      }
    }
  );

  // Add new post form submission
  $("#add-post-form").on("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      title: $("#post-title").val().trim(),
      body: $("#post-body").val().trim(),
      userId: parseInt($("#post-userId").val()),
      tags: $("#post-tags")
        .val()
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    };

    // Validate form data
    const validationRules = {
      title: { required: true, label: "Title", minLength: 5 },
      body: { required: true, label: "Content", minLength: 20 },
      userId: { required: true, label: "User ID", number: true, min: 1 },
    };

    const validation = dataFunctions.validateForm(formData, validationRules);

    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = Object.values(validation.errors).join("\n");
      alert("Please fix the following errors:\n" + errorMessages);
      return;
    }

    // Submit new post
    addNewPost(formData);
  });
}

/**
 * Add a new post to the API
 * @param {Object} postData - Post data to be added
 */
async function addNewPost(postData) {
  try {
    // Show loading state
    const submitBtn = $('#add-post-form button[type="submit"]');
    const originalBtnText = submitBtn.text();
    submitBtn.text("Adding...").prop("disabled", true);

    // Add the post
    const newPost = await dataFunctions.addPost(postData);

    // Reset form
    $("#add-post-form")[0].reset();

    // Show success message
    alert("Post added successfully!");

    // Reload posts to show the new post
    loadPosts();

    // Reset button
    submitBtn.text(originalBtnText).prop("disabled", false);
  } catch (error) {
    console.error("Error adding post:", error);
    alert("Failed to add post. Please try again later.");

    // Reset button
    const submitBtn = $('#add-post-form button[type="submit"]');
    submitBtn.text("Add Post").prop("disabled", false);
  }
}

/**
 * Display error message to the user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Create error element if it doesn't exist
  if ($("#error-message").length === 0) {
    const errorElement = $(
      '<div id="error-message" class="error-alert"></div>'
    );
    $("main").prepend(errorElement);
  }

  // Update error message and show it
  $("#error-message").text(message).slideDown();

  // Hide error message after 5 seconds
  setTimeout(() => {
    $("#error-message").slideUp();
  }, 5000);
}
