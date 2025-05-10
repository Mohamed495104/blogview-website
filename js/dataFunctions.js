"use strict";

/*
 * A JavaScript library for handling API calls and data processing for the BlogView Dashboard.
 * This library provides functions for interacting with the DummyJSON API to fetch, create,
 * update, and delete blog posts, comments, and user information.
 */

const dataFunctions = (() => {
  // Base URL for the DummyJSON API
  const BASE_URL = "https://dummyjson.com";

  /*
   * Makes a fetch request to the API and handles errors
   * @param {string} endpoint - API endpoint to fetch from
   * @param {Object} options - Fetch options (method, headers, body)
   * @returns {Promise} - Promise with API response data
   */
  const makeRequest = async (endpoint, options = {}) => {
    try {
      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Request Error:", error);
      throw error;
    }
  };

  /*
   * Format dates to a readable format
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date (e.g., "Jan 15, 2025")
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown Date";

    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /*
   * Truncate text to a specific length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length (default: 100)
   * @returns {string} - Truncated text with ellipsis if needed
   */
  const truncateText = (text, length = 100) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  /*
   * Get all posts with pagination
   * @param {number} page - Page number
   * @param {number} limit - Number of posts per page
   * @param {Object} options - Additional options (search, sortBy)
   * @returns {Promise} - Promise with paginated posts data
   */
  const getPosts = async (page = 1, limit = 10, options = {}) => {
    const { search = "", sortBy = "", tag = "" } = options;
    let endpoint = `/posts?limit=${limit}&skip=${(page - 1) * limit}`;

    if (search) {
      endpoint = `/posts/search?q=${encodeURIComponent(
        search
      )}&limit=${limit}&skip=${(page - 1) * limit}`;
    }

    const data = await makeRequest(endpoint);

    // Filter by tag if specified
    let filteredPosts = data.posts;
    if (tag) {
      filteredPosts = filteredPosts.filter((post) => post.tags.includes(tag));
    }

    // Sort posts if sortBy is specified
    if (sortBy) {
      filteredPosts = sortPosts(filteredPosts, sortBy);
    }

    return {
      posts: filteredPosts,
      total: data.total,
      limit: data.limit,
      skip: data.skip,
      currentPage: page,
      totalPages: Math.ceil(data.total / limit),
    };
  };

  /*
   * Sort posts based on sorting criteria
   * @param {Array} posts - Array of posts
   * @param {string} sortBy - Sorting criteria (recent, reactions, title)
   * @returns {Array} - Sorted posts array
   */
  const sortPosts = (posts, sortBy) => {
    const sortedPosts = [...posts];

    switch (sortBy) {
      case "recent":
        // Default sorting is by recent, no action needed
        break;
      case "reactions":
        sortedPosts.sort((a, b) => b.reactions - a.reactions);
        break;
      case "title":
        sortedPosts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return sortedPosts;
  };

  /*
   * Get a single post by ID with its author information
   * @param {number} postId - Post ID
   * @returns {Promise} - Promise with post data and author info
   */
  const getPostById = async (postId) => {
    const post = await makeRequest(`/posts/${postId}`);

    // Get author information
    const author = await makeRequest(`/users/${post.userId}`);

    return {
      ...post,
      author,
    };
  };

  /*
   * Get comments for a specific post
   * @param {number} postId - Post ID
   * @returns {Promise} - Promise with comments data
   */
  const getPostComments = async (postId) => {
    const comments = await makeRequest(`/posts/${postId}/comments`);

    // For each comment, fetch the commenter's information
    const commentsWithUsers = await Promise.all(
      comments.comments.map(async (comment) => {
        try {
          const user = await makeRequest(`/users/${comment.user.id}`);
          return {
            ...comment,
            user,
          };
        } catch (error) {
          // If user data couldn't be fetched, return the comment as is
          return comment;
        }
      })
    );

    return {
      comments: commentsWithUsers,
      total: comments.total,
    };
  };

  /*
   * Add a new comment to a post
   * @param {number} postId - Post ID
   * @param {Object} commentData - Comment data (body, userId)
   * @returns {Promise} - Promise with new comment data
   */
  const addComment = async (postId, commentData) => {
    return await makeRequest(`/comments/add`, {
      method: "POST",
      body: JSON.stringify({
        ...commentData,
        postId,
      }),
    });
  };

  /*
   * Delete a comment
   * @param {number} commentId - Comment ID
   * @returns {Promise} - Promise with deleted comment data
   */
  const deleteComment = async (commentId) => {
    return await makeRequest(`/comments/${commentId}`, {
      method: "DELETE",
    });
  };

  /*
   * Add a new post
   * @param {Object} postData - Post data
   * @returns {Promise} - Promise with new post data
   */
  const addPost = async (postData) => {
    return await makeRequest("/posts/add", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  };

  /*
   * Update an existing post
   * @param {number} postId - Post ID
   * @param {Object} postData - Updated post data
   * @returns {Promise} - Promise with updated post data
   */
  const updatePost = async (postId, postData) => {
    return await makeRequest(`/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(postData),
    });
  };

  /*
   * Delete a post
   * @param {number} postId - Post ID
   * @returns {Promise} - Promise with deleted post data
   */
  const deletePost = async (postId) => {
    return await makeRequest(`/posts/${postId}`, {
      method: "DELETE",
    });
  };

  /*
   * Get all users with pagination
   * @param {number} page - Page number
   * @param {number} limit - Number of users per page
   * @param {Object} options - Additional options (search, sortBy, filter)
   * @returns {Promise} - Promise with paginated users data
   */
  const getUsers = async (page = 1, limit = 10, options = {}) => {
    const { search = "", sortBy = "", gender = "" } = options;
    let endpoint = `/users?limit=${limit}&skip=${(page - 1) * limit}`;

    if (search) {
      endpoint = `/users/search?q=${encodeURIComponent(
        search
      )}&limit=${limit}&skip=${(page - 1) * limit}`;
    }

    const data = await makeRequest(endpoint);

    // Filter by gender if specified
    let filteredUsers = data.users;
    if (gender) {
      filteredUsers = filteredUsers.filter((user) => user.gender === gender);
    }

    // Sort users if sortBy is specified
    if (sortBy) {
      filteredUsers = sortUsers(filteredUsers, sortBy);
    }

    return {
      users: filteredUsers,
      total: data.total,
      limit: data.limit,
      skip: data.skip,
      currentPage: page,
      totalPages: Math.ceil(data.total / limit),
    };
  };

  /*
   * Sort users based on sorting criteria
   * @param {Array} users - Array of users
   * @param {string} sortBy - Sorting criteria (name, age, age-desc)
   * @returns {Array} - Sorted users array
   */
  const sortUsers = (users, sortBy) => {
    const sortedUsers = [...users];

    switch (sortBy) {
      case "name":
        sortedUsers.sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        );
        break;
      case "age":
        sortedUsers.sort((a, b) => a.age - b.age);
        break;
      case "age-desc":
        sortedUsers.sort((a, b) => b.age - a.age);
        break;
      default:
        break;
    }

    return sortedUsers;
  };

  /**
   * Get a single user by ID with their posts
   * @param {number} userId - User ID
   * @returns {Promise} - Promise with user data and posts
   */
  const getUserById = async (userId) => {
    const user = await makeRequest(`/users/${userId}`);

    // Get user's posts
    const userPosts = await makeRequest(`/users/${userId}/posts`);

    return {
      ...user,
      posts: userPosts.posts,
    };
  };

  /**
   * Add a new user
   * @param {Object} userData - User data
   * @returns {Promise} - Promise with new user data
   */
  const addUser = async (userData) => {
    return await makeRequest("/users/add", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  };

  /**
   * Update a user
   * @param {number} userId - User ID
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Promise with updated user data
   */
  const updateUser = async (userId, userData) => {
    return await makeRequest(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  };

  /**
   * Delete a user
   * @param {number} userId - User ID
   * @returns {Promise} - Promise with deleted user data
   */
  const deleteUser = async (userId) => {
    return await makeRequest(`/users/${userId}`, {
      method: "DELETE",
    });
  };

  /**
   * Get all unique tags from posts
   * @returns {Promise} - Promise with array of unique tags
   */
  const getAllTags = async () => {
    const posts = await makeRequest("/posts?limit=100");

    // Extract all tags from posts and create a set of unique tags
    const tagsSet = new Set();
    posts.posts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  };

  /**
   * Get dashboard statistics
   * @returns {Promise} - Promise with dashboard statistics
   */
  const getDashboardStats = async () => {
    try {
      const [posts, users, comments] = await Promise.all([
        makeRequest("/posts?limit=1"),
        makeRequest("/users?limit=1"),
        makeRequest("/comments?limit=1"),
      ]);

      return {
        totalPosts: posts.total || 0,
        totalUsers: users.total || 0,
        totalComments: comments.total || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      return {
        totalPosts: 0,
        totalUsers: 0,
        totalComments: 0,
      };
    }
  };

  /**
   * Get related posts based on tags
   * @param {number} postId - Current post ID to exclude
   * @param {Array} tags - Tags to match
   * @param {number} limit - Number of related posts to fetch
   * @returns {Promise} - Promise with related posts
   */
  const getRelatedPosts = async (postId, tags, limit = 3) => {
    if (!tags || !tags.length) {
      return { posts: [] };
    }

    // Get posts that match at least one tag
    const tagQueries = tags
      .map((tag) => `tag=${encodeURIComponent(tag)}`)
      .join("&");
    const relatedData = await makeRequest(`/posts?limit=20&${tagQueries}`);

    // Filter out the current post and limit the results
    const relatedPosts = relatedData.posts
      .filter((post) => post.id !== postId)
      .slice(0, limit);

    return { posts: relatedPosts };
  };

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} - Validation results with errors
   */
  const validateForm = (formData, rules) => {
    const errors = {};

    for (const field in rules) {
      const value = formData[field];
      const fieldRules = rules[field];

      // Required validation
      if (fieldRules.required) {
        // Check if value is undefined, null, or empty
        if (value === undefined || value === null) {
          errors[field] = `${fieldRules.label || field} is required`;
          continue;
        }

        // For string values, check if it's empty after trimming
        if (typeof value === "string" && value.trim() === "") {
          errors[field] = `${fieldRules.label || field} is required`;
          continue;
        }

        // For arrays, check if it's empty
        if (Array.isArray(value) && value.length === 0) {
          errors[field] = `${fieldRules.label || field} is required`;
          continue;
        }
      }

      // Skip further validation if value is undefined or null
      if (value === undefined || value === null) {
        continue;
      }

      // Email validation (only for string values)
      if (
        fieldRules.email &&
        typeof value === "string" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        errors[field] = "Please enter a valid email address";
      }

      // Min length validation (only for string values)
      if (
        fieldRules.minLength &&
        typeof value === "string" &&
        value.length < fieldRules.minLength
      ) {
        errors[field] = `${fieldRules.label || field} must be at least ${
          fieldRules.minLength
        } characters`;
      }

      // Max length validation (only for string values)
      if (
        fieldRules.maxLength &&
        typeof value === "string" &&
        value.length > fieldRules.maxLength
      ) {
        errors[field] = `${fieldRules.label || field} must be less than ${
          fieldRules.maxLength
        } characters`;
      }

      // Number validation
      if (fieldRules.number && isNaN(Number(value))) {
        errors[field] = `${fieldRules.label || field} must be a number`;
      }

      // Min value validation (for numeric values)
      if (
        fieldRules.min !== undefined &&
        !isNaN(Number(value)) &&
        Number(value) < fieldRules.min
      ) {
        errors[field] = `${fieldRules.label || field} must be at least ${
          fieldRules.min
        }`;
      }

      // Max value validation (for numeric values)
      if (
        fieldRules.max !== undefined &&
        !isNaN(Number(value)) &&
        Number(value) > fieldRules.max
      ) {
        errors[field] = `${fieldRules.label || field} must be less than ${
          fieldRules.max
        }`;
      }

      // Pattern validation (only for string values)
      if (
        fieldRules.pattern &&
        typeof value === "string" &&
        !fieldRules.pattern.test(value)
      ) {
        errors[field] =
          fieldRules.patternMessage ||
          `${fieldRules.label || field} is invalid`;
      }

      // Custom validation
      if (fieldRules.custom && !fieldRules.custom(value)) {
        errors[field] =
          fieldRules.customMessage || `${fieldRules.label || field} is invalid`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Return public methods
  return {
    getPosts,
    getPostById,
    getPostComments,
    addComment,
    deleteComment,
    addPost,
    updatePost,
    deletePost,
    getUsers,
    getUserById,
    addUser,
    updateUser,
    deleteUser,
    getAllTags,
    getDashboardStats,
    getRelatedPosts,
    formatDate,
    truncateText,
    validateForm,
  };
})();

// Make the library available globally
window.dataFunctions = dataFunctions;
