/* global Partner */
'use strict';

/**
 * Partner.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

// Public dependencies.
const _ = require('lodash');

// Strapi utilities.
const utils = require('strapi-hook-bookshelf/lib/utils/');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');


module.exports = {

  /**
   * Promise to fetch all partners.
   *
   * @return {Promise}
   */

  fetchAll: (params, populate) => {
    // Select field to populate.
    const withRelated = populate || Partner.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const filters = convertRestQueryParams(params);

    return Partner.query(buildQuery({ model: Partner, filters }))
      .fetchAll({ withRelated })
      .then(data => data.toJSON());
  },

  /**
   * Promise to fetch a/an partner.
   *
   * @return {Promise}
   */

  fetch: (params) => {
    // Select field to populate.
    const populate = Partner.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    return Partner.forge(_.pick(params, 'id')).fetch({
      withRelated: populate
    });
  },

  /**
   * Promise to count a/an partner.
   *
   * @return {Promise}
   */

  count: (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = convertRestQueryParams(params);

    return Partner.query(buildQuery({ model: Partner, filters: _.pick(filters, 'where') })).count();
  },

  /**
   * Promise to add a/an partner.
   *
   * @return {Promise}
   */

  add: async (values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Partner.associations.map(ast => ast.alias));
    const data = _.omit(values, Partner.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Partner.forge(data).save();

    // Create relational data and return the entry.
    return Partner.updateRelations({ id: entry.id , values: relations });
  },

  /**
   * Promise to edit a/an partner.
   *
   * @return {Promise}
   */

  edit: async (params, values) => {
    // Extract values related to relational data.
    const relations = _.pick(values, Partner.associations.map(ast => ast.alias));
    const data = _.omit(values, Partner.associations.map(ast => ast.alias));

    // Create entry with no-relational data.
    const entry = await Partner.forge(params).save(data);

    // Create relational data and return the entry.
    return Partner.updateRelations(Object.assign(params, { values: relations }));
  },

  /**
   * Promise to remove a/an partner.
   *
   * @return {Promise}
   */

  remove: async (params) => {
    params.values = {};
    Partner.associations.map(association => {
      switch (association.nature) {
        case 'oneWay':
        case 'oneToOne':
        case 'manyToOne':
        case 'oneToManyMorph':
          params.values[association.alias] = null;
          break;
        case 'oneToMany':
        case 'manyToMany':
        case 'manyToManyMorph':
          params.values[association.alias] = [];
          break;
        default:
      }
    });

    await Partner.updateRelations(params);

    return Partner.forge(params).destroy();
  },

  /**
   * Promise to search a/an partner.
   *
   * @return {Promise}
   */

  search: async (params) => {
    // Convert `params` object to filters compatible with Bookshelf.
    const filters = strapi.utils.models.convertParams('partner', params);
    // Select field to populate.
    const populate = Partner.associations
      .filter(ast => ast.autoPopulate !== false)
      .map(ast => ast.alias);

    const associations = Partner.associations.map(x => x.alias);
    const searchText = Object.keys(Partner._attributes)
      .filter(attribute => attribute !== Partner.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['string', 'text'].includes(Partner._attributes[attribute].type));

    const searchInt = Object.keys(Partner._attributes)
      .filter(attribute => attribute !== Partner.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['integer', 'decimal', 'float'].includes(Partner._attributes[attribute].type));

    const searchBool = Object.keys(Partner._attributes)
      .filter(attribute => attribute !== Partner.primaryKey && !associations.includes(attribute))
      .filter(attribute => ['boolean'].includes(Partner._attributes[attribute].type));

    const query = (params._q || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

    return Partner.query(qb => {
      if (!_.isNaN(_.toNumber(query))) {
        searchInt.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
        });
      }

      if (query === 'true' || query === 'false') {
        searchBool.forEach(attribute => {
          qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
        });
      }

      // Search in columns with text using index.
      switch (Partner.client) {
        case 'mysql':
          qb.orWhereRaw(`MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`, `*${query}*`);
          break;
        case 'pg': {
          const searchQuery = searchText.map(attribute =>
            _.toLower(attribute) === attribute
              ? `to_tsvector(${attribute})`
              : `to_tsvector('${attribute}')`
          );

          qb.orWhereRaw(`${searchQuery.join(' || ')} @@ to_tsquery(?)`, query);
          break;
        }
      }

      if (filters.sort) {
        qb.orderBy(filters.sort.key, filters.sort.order);
      }

      if (filters.skip) {
        qb.offset(_.toNumber(filters.skip));
      }

      if (filters.limit) {
        qb.limit(_.toNumber(filters.limit));
      }
    }).fetchAll({
      withRelated: populate
    });
  }
};
