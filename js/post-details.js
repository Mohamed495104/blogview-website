"use strict";

/*
 * Handles the functionality for the post details page
 */

let postId = null;
let currentPost = null;

$(document).ready(function () {
  // Get post ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  postId = urlParams.get("id");

  if (!postId) {
    // If no post ID provided, show error and redirect
    showErrorMessage("No post ID provided");
    setTimeout(() => {
      window.location.href = "posts.html";
    }, 2000);
    return;
  }

  // Load post details
  loadPostDetails();

  // Set up event listeners
  setupEventListeners();
});

/**
 * Load post details, comments, and related posts
 */
async function loadPostDetails() {
  try {
    // Load post details
    currentPost = await dataFunctions.getPostById(postId);
    console.log("Loaded post details:", JSON.stringify(currentPost));

    // Display post content
    displayPostContent(currentPost);

    // Load and display comments
    loadComments();

    // Load related posts
    loadRelatedPosts(currentPost.tags);
  } catch (error) {
    console.error("Error loading post details:", error);
    $("#post-loading").html(
      "Error loading post details. Please try again later."
    );
  }
}

/**
 * Display post content in the DOM
 * @param {Object} post - Post data with author information
 */
function displayPostContent(post) {
  // Get reactions count - handle both when it's a number or an object
  const reactionsCount =
    typeof post.reactions === "object"
      ? post.reactions.count || 0
      : post.reactions || 0;

  console.log("Display post content - Reactions count:", reactionsCount);

  // Set page title
  document.title = `${post.title} - BlogView Dashboard`;

  // Update breadcrumb
  $("#post-title-breadcrumb").text(post.title);

  // Hide loading and show content
  $("#post-loading").addClass("hidden");
  $("#post-content").removeClass("hidden");

  // Set post content
  $("#post-title").text(post.title);
  $("#post-body").text(post.body);
  $("#post-reactions-count").text(reactionsCount);

  // Set author information
  const authorName = `${post.author.firstName} ${post.author.lastName}`;
  $("#post-author-link")
    .text(authorName)
    .attr("href", `users.html?id=${post.author.id}`);

  // Set tags
  const tagsContainer = $("#post-tags");
  tagsContainer.empty();

  if (post.tags && post.tags.length > 0) {
    post.tags.forEach((tag) => {
      tagsContainer.append(`<span class="tag">${tag}</span>`);
    });
  } else {
    tagsContainer.append('<span class="tag">No tags</span>');
  }

  // Populate edit form
  $("#edit-title").val(post.title);
  $("#edit-body").val(post.body);
  $("#edit-tags").val(post.tags.join(", "));
}

/**
 * Load comments for the current post
 */
async function loadComments() {
  try {
    $("#comments-loading").removeClass("hidden");

    const commentsData = await dataFunctions.getPostComments(postId);
    const comments = commentsData.comments;

    // Update comment count
    $("#comment-count").text(comments.length);

    // Display comments
    displayComments(comments);
  } catch (error) {
    console.error("Error loading comments:", error);
    $("#comments-container").html(
      "<p>Error loading comments. Please try again later.</p>"
    );
  } finally {
    $("#comments-loading").addClass("hidden");
  }
}

/**
 * Display comments in the DOM
 * @param {Array} comments - Array of comment objects
 */
function displayComments(comments) {
  const commentsContainer = $("#comments-container");
  commentsContainer.empty();

  if (comments.length === 0) {
    commentsContainer.html("<p>No comments yet. Be the first to comment!</p>");
    return;
  }

  comments.forEach((comment) => {
    const commentElement = createCommentElement(comment);
    commentsContainer.append(commentElement);
  });
}

/**
 * Create a comment DOM element
 * @param {Object} comment - Comment data
 * @returns {jQuery} - jQuery object representing the comment
 */
function createCommentElement(comment) {
  // Get user information (might not be available for all comments)
  let userName = "Unknown User";
  if (comment.user) {
    userName = comment.user.firstName
      ? `${comment.user.firstName} ${comment.user.lastName}`
      : `User ${comment.user.id}`;
  }

  const commentElement = $(`
        <div class="comment" data-comment-id="${comment.id}">
            <div class="comment-header">
                <strong class="comment-author">${userName}</strong>
                <span class="comment-date">${dataFunctions.formatDate(
                  comment.createdAt || new Date()
                )}</span>
            </div>
            <div class="comment-body">
                <p>${comment.body}</p>
            </div>
            <div class="comment-actions">
                <button class="btn-sm delete-comment">Delete</button>
            </div>
        </div>
    `);

  return commentElement;
}

/**
 * Load related posts based on tags
 * @param {Array} tags - Tags to match for related posts
 */
async function loadRelatedPosts(tags) {
  try {
    const relatedData = await dataFunctions.getRelatedPosts(postId, tags, 3);
    const relatedPosts = relatedData.posts;

    const relatedContainer = $("#related-posts");
    relatedContainer.empty();

    if (relatedPosts.length === 0) {
      relatedContainer.html("<p>No related posts found.</p>");
      return;
    }

    relatedPosts.forEach((post) => {
      const postCard = createRelatedPostCard(post);
      relatedContainer.append(postCard);
    });
  } catch (error) {
    console.error("Error loading related posts:", error);
    $("#related-posts").html("<p>Failed to load related posts.</p>");
  } finally {
    $("#related-loading").addClass("hidden");
  }
}

/**
 * Create a post card for related posts
 * @param {Object} post - Post data
 * @returns {jQuery} - jQuery object representing the post card
 */
function createRelatedPostCard(post) {
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
                  100
                )}</p>
                <div class="post-tags">
                    ${tagsHtml}
                </div>
                <div class="post-meta">
                    <span class="post-reactions">❤️ ${reactionsCount}</span>
                </div>
            </div>
        </div>
    `);

  return postCard;
}

/**
 * Set up event listeners for the post details page
 */
function setupEventListeners() {
  // Like post button
  $("#like-post").on("click", function () {
    likePost();
  });

  // Edit post button
  $("#edit-post").on("click", function () {
    // Hide post content and show edit form
    $("#post-content").addClass("hidden");
    $("#edit-form-container").removeClass("hidden");
  });

  // Cancel edit button
  $("#cancel-edit").on("click", function (e) {
    e.preventDefault();
    // Hide edit form and show post content
    $("#edit-form-container").addClass("hidden");
    $("#post-content").removeClass("hidden");
  });

  // Edit post form submission
  $("#edit-post-form").on("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      title: $("#edit-title").val().trim(),
      body: $("#edit-body").val().trim(),
      tags: $("#edit-tags")
        .val()
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
    };

    // Validate form data
    const validationRules = {
      title: { required: true, label: "Title", minLength: 5 },
      body: { required: true, label: "Content", minLength: 20 },
    };

    const validation = dataFunctions.validateForm(formData, validationRules);

    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = Object.values(validation.errors).join("\n");
      alert("Please fix the following errors:\n" + errorMessages);
      return;
    }

    // Update post
    updatePost(formData);
  });

  // Delete post button
  $("#delete-post").on("click", function () {
    if (
      confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      deletePost();
    }
  });

  // Add comment form submission
  $("#add-comment-form").on("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      body: $("#comment-body").val().trim(),
      userId: parseInt($("#comment-userId").val()),
    };

    // Validate form data
    const validationRules = {
      body: { required: true, label: "Comment" },
      userId: { required: true, label: "User ID", number: true, min: 1 },
    };

    const validation = dataFunctions.validateForm(formData, validationRules);

    if (!validation.isValid) {
      // Show validation errors
      const errorMessages = Object.values(validation.errors).join("\n");
      alert("Please fix the following errors:\n" + errorMessages);
      return;
    }

    // Add comment
    addComment(formData);
  });

  // Delete comment button
  $("#comments-container").on("click", ".delete-comment", function () {
    const commentId = $(this).closest(".comment").data("comment-id");

    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment(commentId);
    }
  });
}

/**
 * Like post (increment reactions)
 */
async function likePost() {
  try {
    console.log(
      "Like button clicked. Current post:",
      JSON.stringify(currentPost)
    );

    // Get current reactions count
    const currentReactions =
      typeof currentPost.reactions === "object"
        ? currentPost.reactions.count || 0
        : currentPost.reactions || 0;

    console.log("Current reactions:", currentReactions);

    // Prepare update data
    let updatedData = {};

    // For DummyJSON.com, we need to maintain the expected data structure
    // Since we're not sure which format is expected, let's use a simple approach
    updatedData = {
      reactions: currentReactions + 1,
    };

    console.log("Sending update data:", JSON.stringify(updatedData));

    // Update the post
    const updatedPost = await dataFunctions.updatePost(postId, updatedData);
    console.log("API response:", JSON.stringify(updatedPost));

    // Get updated reactions count
    const updatedReactions =
      typeof updatedPost.reactions === "object"
        ? updatedPost.reactions.count || 0
        : updatedPost.reactions || 0;

    console.log("Updated reactions to display:", updatedReactions);

    // Update reactions count in the UI
    $("#post-reactions-count").text(updatedReactions);

    // Update current post data
    currentPost.reactions = updatedPost.reactions;

    // Force-update the UI display
    // Sometimes the DOM might not update if the value is the same type but different
    const displayReactions = parseInt($("#post-reactions-count").text()) || 0;
    if (displayReactions !== updatedReactions) {
      console.log("DOM not updated correctly. Force update.");
      $("#post-reactions-count").text(updatedReactions);
    }

    // Disable like button temporarily to prevent spam
    const likeButton = $("#like-post");
    likeButton.prop("disabled", true).text("Liked!");

    setTimeout(() => {
      likeButton.prop("disabled", false).text("👍 Like");
    }, 2000);
  } catch (error) {
    console.error("Error liking post:", error);
    showErrorMessage("Failed to like post. Please try again.");
  }
}

/**
 * Update post with new data
 * @param {Object} postData - Updated post data
 */
async function updatePost(postData) {
  try {
    // Show loading state
    const submitBtn = $('#edit-post-form button[type="submit"]');
    const originalBtnText = submitBtn.text();
    submitBtn.text("Saving...").prop("disabled", true);

    console.log("Updating post with data:", JSON.stringify(postData));

    // Update the post
    const updatedPost = await dataFunctions.updatePost(postId, postData);
    console.log("Update response:", JSON.stringify(updatedPost));

    // Update current post data
    currentPost = { ...currentPost, ...updatedPost };

    // Update displayed post
    displayPostContent(currentPost);

    // Hide edit form and show post content
    $("#edit-form-container").addClass("hidden");
    $("#post-content").removeClass("hidden");

    // Show success message
    showSuccessMessage("Post updated successfully!");

    // Reset button
    submitBtn.text(originalBtnText).prop("disabled", false);
  } catch (error) {
    console.error("Error updating post:", error);
    showErrorMessage("Failed to update post. Please try again later.");

    // Reset button
    const submitBtn = $('#edit-post-form button[type="submit"]');
    submitBtn.text("Save Changes").prop("disabled", false);
  }
}

/**
 * Delete the current post
 */
async function deletePost() {
  try {
    // Show loading state
    const deleteBtn = $("#delete-post");
    deleteBtn.text("Deleting...").prop("disabled", true);

    // Delete the post
    await dataFunctions.deletePost(postId);

    // Show success message and redirect
    alert("Post deleted successfully!");
    window.location.href = "posts.html";
  } catch (error) {
    console.error("Error deleting post:", error);
    showErrorMessage("Failed to delete post. Please try again later.");

    // Reset button
    $("#delete-post").text("Delete Post").prop("disabled", false);
  }
}

/**
 * Add a new comment to the post
 * @param {Object} commentData - Comment data
 */
async function addComment(commentData) {
  try {
    // Show loading state
    const submitBtn = $('#add-comment-form button[type="submit"]');
    const originalBtnText = submitBtn.text();
    submitBtn.text("Submitting...").prop("disabled", true);

    // Add the comment
    await dataFunctions.addComment(postId, commentData);

    // Reset form
    $("#add-comment-form")[0].reset();

    // Reload comments
    loadComments();

    // Show success message
    showSuccessMessage("Comment added successfully!");

    // Reset button
    submitBtn.text(originalBtnText).prop("disabled", false);
  } catch (error) {
    console.error("Error adding comment:", error);
    showErrorMessage("Failed to add comment. Please try again later.");

    // Reset button
    const submitBtn = $('#add-comment-form button[type="submit"]');
    submitBtn.text("Submit Comment").prop("disabled", false);
  }
}

/**
 * Delete a comment
 * @param {number} commentId - Comment ID to delete
 */
async function deleteComment(commentId) {
  try {
    // Delete the comment
    await dataFunctions.deleteComment(commentId);

    // Remove comment from DOM
    $(`.comment[data-comment-id="${commentId}"]`).fadeOut(300, function () {
      $(this).remove();

      // Update comment count
      const currentCount = parseInt($("#comment-count").text());
      $("#comment-count").text(currentCount - 1);

      // Check if there are no comments left
      if (currentCount - 1 === 0) {
        $("#comments-container").html(
          "<p>No comments yet. Be the first to comment!</p>"
        );
      }
    });

    // Show success message
    showSuccessMessage("Comment deleted successfully!");
  } catch (error) {
    console.error("Error deleting comment:", error);
    showErrorMessage("Failed to delete comment. Please try again later.");
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

/**
 * Display success message to the user
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
  // Create success element if it doesn't exist
  if ($("#success-message").length === 0) {
    const successElement = $(
      '<div id="success-message" class="success-alert"></div>'
    );
    $("main").prepend(successElement);
  }

  // Update success message and show it
  $("#success-message").text(message).slideDown();

  // Hide success message after 3 seconds
  setTimeout(() => {
    $("#success-message").slideUp();
  }, 3000);
}
