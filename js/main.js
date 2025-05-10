"use strict";

/*
 * Handles the functionality for the home page of the BlogView Dashboard
 */

$(document).ready(function () {
  // Load dashboard statistics
  loadDashboardStats();

  // Load featured posts
  loadFeaturedPosts();

  // Add event listeners
  setupEventListeners();
});

/*
 * Load dashboard statistics (post count, user count, comment count)
 */
async function loadDashboardStats() {
  try {
    const stats = await dataFunctions.getDashboardStats();

    // Update the statistics in the DOM
    $("#post-count .stat-number").text(stats.totalPosts);
    $("#user-count .stat-number").text(stats.totalUsers);
    $("#comment-count .stat-number").text(stats.totalComments);
  } catch (error) {
    console.error("Error loading dashboard statistics:", error);
    // Display error message to user
    const errorMsg =
      "Failed to load dashboard statistics. Please try again later.";
    showErrorMessage(errorMsg);
  }
}

/*
 * Load featured posts for the home page
 */
async function loadFeaturedPosts() {
  try {
    // Get posts with the most reactions
    const postsData = await dataFunctions.getPosts(1, 6, {
      sortBy: "reactions",
    });
    const featuredPosts = postsData.posts;

    if (featuredPosts.length === 0) {
      $("#featured-posts-container").html(
        "<p>No featured posts available.</p>"
      );
      return;
    }

    // Clear loading message
    $("#featured-posts-container").empty();

    // Add each featured post to the container
    featuredPosts.forEach((post) => {
      const postElement = createPostCard(post);
      $("#featured-posts-container").append(postElement);
    });
  } catch (error) {
    console.error("Error loading featured posts:", error);
    // Display error message
    $("#featured-posts-container").html(
      "<p>Failed to load featured posts. Please try again later.</p>"
    );
  }
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
        <div class="post-card">
            <div class="post-content">
                <h3 class="post-title">
                    <a href="post-details.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="post-excerpt">${dataFunctions.truncateText(
                  post.body,
                  120
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

/*
 * Setup event listeners for the home page
 */
function setupEventListeners() {
  // Example of using jQuery for event handling
  $(".logo").on("click", function () {
    // Refresh the page when logo is clicked
    window.location.href = "index.html";
  });
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
