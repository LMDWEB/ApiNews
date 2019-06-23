'use strict';

/**
 * Website.js controller
 *
 * @description: A set of functions called "actions" for managing `Website`.
 */

module.exports = {

  /**
   * Retrieve website records.
   *
   * @return {Object|Array}
   */

  find: async (ctx, next, { populate } = {}) => {
    if (ctx.query._q) {
      return strapi.services.website.search(ctx.query);
    } else {
      return strapi.services.website.fetchAll(ctx.query, populate);
    }
  },

  /**
   * Retrieve a website record.
   *
   * @return {Object}
   */

  findOne: async (ctx) => {
    return strapi.services.website.fetch(ctx.params);
  },

  /**
   * Count website records.
   *
   * @return {Number}
   */

  count: async (ctx, next, { populate } = {}) => {
    return strapi.services.website.count(ctx.query, populate);
  },

  /**
   * Create a/an website record.
   *
   * @return {Object}
   */

  create: async (ctx) => {
    return strapi.services.website.add(ctx.request.body);
  },

  /**
   * Update a/an website record.
   *
   * @return {Object}
   */

  update: async (ctx, next) => {
    return strapi.services.website.edit(ctx.params, ctx.request.body) ;
  },

  /**
   * Destroy a/an website record.
   *
   * @return {Object}
   */

  destroy: async (ctx, next) => {
    return strapi.services.website.remove(ctx.params);
  }
};
