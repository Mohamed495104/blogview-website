"use strict";

/*
 * Handles the functionality for the users page
 */

// State variables
let currentPage = 1;
let totalPages = 1;
let usersPerPage = 12;
let currentSearchQuery = "";
let currentSortOption = "name";
let currentGenderFilter = "";

$(document).ready(function () {
  // Load initial users
  loadUsers();

  // Set up event listeners
  setupEventListeners();
});

/*
 * Load users with current filters and pagination
 */
async function loadUsers() {
  try {
    // Show loading state
    $("#users-grid").html('<div class="loading">Loading users...</div>');

    // Get users with current filters, sorting, and pagination
    const options = {
      search: currentSearchQuery,
      sortBy: currentSortOption,
      gender: currentGenderFilter,
    };

    const usersData = await dataFunctions.getUsers(
      currentPage,
      usersPerPage,
      options
    );

    // Update total pages
    totalPages = usersData.totalPages;

    // Display users
    displayUsers(usersData.users);

    // Update pagination
    updatePagination();
  } catch (error) {
    console.error("Error loading users:", error);
    $("#users-grid").html(
      "<p>Failed to load users. Please try again later.</p>"
    );
  }
}

/*
 * Display users in the grid
 * @param {Array} users - Array of user objects
 */
function displayUsers(users) {
  // Clear users container
  const usersGrid = $("#users-grid");
  usersGrid.empty();

  if (users.length === 0) {
    usersGrid.html("<p>No users found matching your criteria.</p>");
    return;
  }

  // Create and append user cards
  users.forEach((user) => {
    const userCard = createUserCard(user);
    usersGrid.append(userCard);
  });
}

/*
 * Create a user card element
 * @param {Object} user - User data
 * @returns {jQuery} - jQuery object representing the user card
 */
function createUserCard(user) {
  const userCard = $(`
        <div class="user-card" data-user-id="${user.id}">
            <div class="user-avatar">
                <img src="${user.image}" alt="${user.firstName} ${user.lastName}">
            </div>
            <div class="user-info">
                <h3 class="user-name">${user.firstName} ${user.lastName}</h3>
                <div class="user-details">
                    <p>@${user.username}</p>
                    <p>${user.email}</p>
                    <p>${user.age} years old</p>
                </div>
            </div>
        </div>
    `);

  // Add click event to open user details modal
  userCard.on("click", function () {
    openUserModal(user.id);
  });

  return userCard;
}

/*
 * Update pagination controls
 */
function updatePagination() {
  const paginationContainer = $("#users-pagination");
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

/*
 * Open user details modal
 * @param {number} userId - User ID
 */
async function openUserModal(userId) {
  try {
    // Show loading state
    $("#user-detail-content").html(
      '<div class="loading">Loading user details...</div>'
    );
    $("#user-posts-list").html(
      '<div class="loading">Loading user posts...</div>'
    );

    // Show modal
    $("#user-modal").removeClass("hidden");

    // Get user details
    const userData = await dataFunctions.getUserById(userId);

    // Display user details
    displayUserDetails(userData);

    // Display user's posts
    displayUserPosts(userData.posts);
  } catch (error) {
    console.error("Error loading user details:", error);
    $("#user-detail-content").html(
      "<p>Failed to load user details. Please try again later.</p>"
    );
    $("#user-posts-list").html("<p>Failed to load user posts.</p>");
  }
}

/*
 * Display user details in the modal
 * @param {Object} user - User data
 */
function displayUserDetails(user) {
  const userDetailContent = $("#user-detail-content");
  userDetailContent.empty();

  // Create user details HTML
  const userDetails = $(`
        <div class="user-details-header">
            <div class="user-avatar-large">
                <img src="${user.image}" alt="${user.firstName} ${
    user.lastName
  }">
            </div>
            <div class="user-info-large">
                <h2>${user.firstName} ${user.lastName}</h2>
                <p class="username">@${user.username}</p>
            </div>
        </div>
        <div class="user-details-content">
            <div class="detail-group">
                <h4>Contact Information</h4>
                <p>Email: ${user.email}</p>
                <p>Phone: ${user.phone}</p>
            </div>
            <div class="detail-group">
                <h4>Personal Details</h4>
                <p>Age: ${user.age}</p>
                <p>Gender: ${user.gender}</p>
                <p>Birth Date: ${dataFunctions.formatDate(user.birthDate)}</p>
            </div>
            <div class="detail-group">
                <h4>Address</h4>
                <p>${user.address.address}, ${user.address.city}</p>
                <p>${user.address.state}, ${user.address.postalCode}</p>
            </div>
            <div class="detail-group">
                <h4>Other Information</h4>
                <p>Blood Group: ${user.bloodGroup}</p>
                <p>Height: ${user.height} cm</p>
                <p>Weight: ${user.weight} kg</p>
            </div>
        </div>
        <div class="user-actions">
            <button id="edit-user-btn" class="btn-sm" data-user-id="${
              user.id
            }">Edit User</button>
            <button id="delete-user-btn" class="btn-sm btn-danger" data-user-id="${
              user.id
            }">Delete User</button>
        </div>
    `);

  userDetailContent.append(userDetails);
}

/*
 * Display user's posts in the modal
 * @param {Array} posts - Array of post objects
 */
function displayUserPosts(posts) {
  const userPostsList = $("#user-posts-list");
  userPostsList.empty();

  if (!posts || posts.length === 0) {
    userPostsList.html("<p>This user has not created any posts yet.</p>");
    return;
  }

  // Create post list items
  posts.forEach((post) => {
    // Get reactions count - handle both when it's a number or an object
    const reactionsCount =
      typeof post.reactions === "object"
        ? post.reactions.count || 0
        : post.reactions || 0;

    const postItem = $(`
            <div class="user-post-item">
                <h4><a href="post-details.html?id=${post.id}">${
      post.title
    }</a></h4>
                <p>${dataFunctions.truncateText(post.body, 100)}</p>
                <div class="post-meta">
                    <span>❤️ ${reactionsCount}</span>
                </div>
            </div>
        `);

    userPostsList.append(postItem);
  });
}
/*
 * Set up event listeners for the users page
 */
function setupEventListeners() {
  // Search button click
  $("#search-users-btn").on("click", function () {
    currentSearchQuery = $("#user-search").val().trim();
    currentPage = 1; // Reset to first page
    loadUsers();
  });

  // Search input enter key
  $("#user-search").on("keypress", function (e) {
    if (e.which === 13) {
      currentSearchQuery = $(this).val().trim();
      currentPage = 1; // Reset to first page
      loadUsers();
    }
  });

  // Gender filter change
  $("#gender-filter").on("change", function () {
    currentGenderFilter = $(this).val();
    currentPage = 1; // Reset to first page
    loadUsers();
  });

  // Sort users change
  $("#sort-users").on("change", function () {
    currentSortOption = $(this).val();
    currentPage = 1; // Reset to first page
    loadUsers();
  });

  // Pagination: previous page
  $("#users-pagination").on("click", "#prev-page", function () {
    if (currentPage > 1) {
      currentPage--;
      loadUsers();
      // Scroll to top of users section
      $("html, body").animate(
        {
          scrollTop: $("#users-grid").offset().top - 100,
        },
        200
      );
    }
  });

  // Pagination: next page
  $("#users-pagination").on("click", "#next-page", function () {
    if (currentPage < totalPages) {
      currentPage++;
      loadUsers();
      // Scroll to top of users section
      $("html, body").animate(
        {
          scrollTop: $("#users-grid").offset().top - 100,
        },
        200
      );
    }
  });

  // Pagination: specific page
  $("#users-pagination").on(
    "click",
    "button:not(#prev-page):not(#next-page)",
    function () {
      const pageNum = $(this).data("page");
      if (pageNum !== currentPage) {
        currentPage = pageNum;
        loadUsers();
        // Scroll to top of users section
        $("html, body").animate(
          {
            scrollTop: $("#users-grid").offset().top - 100,
          },
          200
        );
      }
    }
  );

  // Close user modal
  $(".close-modal").on("click", function () {
    $("#user-modal").addClass("hidden");
  });

  // Close modal when clicking outside the content
  $("#user-modal").on("click", function (e) {
    if ($(e.target).is("#user-modal")) {
      $("#user-modal").addClass("hidden");
    }
  });

  // Edit user button in modal
  $("#user-modal").on("click", "#edit-user-btn", function () {
    const userId = $(this).data("user-id");
    // In a real application, you would implement an edit form
    alert(
      "Edit user functionality would be implemented here for user ID: " + userId
    );
  });

  // Delete user button in modal
  $("#user-modal").on("click", "#delete-user-btn", function () {
    const userId = $(this).data("user-id");
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      deleteUser(userId);
    }
  });

  // Add new user form submission
  $("#add-user-form").on("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      firstName: $("#user-firstname").val().trim(),
      lastName: $("#user-lastname").val().trim(),
      email: $("#user-email").val().trim(),
      age: parseInt($("#user-age").val()),
      gender: $("#user-gender").val(),
      username: $("#user-username").val().trim(),
    };

    // Validate form data
    const validationRules = {
      firstName: { required: true, label: "First Name" },
      lastName: { required: true, label: "Last Name" },
      email: { required: true, label: "Email", email: true },
      age: { required: true, label: "Age", number: true, min: 13 },
      gender: { required: true, label: "Gender" },
      username: { required: true, label: "Username", minLength: 4 },
    };

    const validation = dataFunctions.validateForm(formData, validationRules);

    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = Object.values(validation.errors).join("\n");
      alert("Please fix the following errors:\n" + errorMessages);
      return;
    }

    // Submit new user
    addNewUser(formData);
  });
}

/*
 * Add a new user to the API
 * @param {Object} userData - User data to be added
 */
async function addNewUser(userData) {
  try {
    // Show loading state
    const submitBtn = $('#add-user-form button[type="submit"]');
    const originalBtnText = submitBtn.text();
    submitBtn.text("Adding...").prop("disabled", true);

    // Add the user
    const newUser = await dataFunctions.addUser(userData);

    // Reset form
    $("#add-user-form")[0].reset();

    // Show success message
    alert("User added successfully!");

    // Reload users to show the new user
    loadUsers();

    // Reset button
    submitBtn.text(originalBtnText).prop("disabled", false);
  } catch (error) {
    console.error("Error adding user:", error);
    alert("Failed to add user. Please try again later.");

    // Reset button
    const submitBtn = $('#add-user-form button[type="submit"]');
    submitBtn.text("Add User").prop("disabled", false);
  }
}

/*
 * Delete a user
 * @param {number} userId - User ID to delete
 */
async function deleteUser(userId) {
  try {
    // Delete the user
    await dataFunctions.deleteUser(userId);

    // Close modal
    $("#user-modal").addClass("hidden");

    // Remove user card from DOM
    $(`.user-card[data-user-id="${userId}"]`).fadeOut(300, function () {
      $(this).remove();
    });

    // Show success message
    alert("User deleted successfully!");

    // Reload users after a short delay
    setTimeout(() => {
      loadUsers();
    }, 1000);
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Failed to delete user. Please try again later.");
  }
}
