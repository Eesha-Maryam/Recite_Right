const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/response');
const { searchService } = require('../services/search.service');

const search = catchAsync(async (req, res) => {
  const { query } = req.query;
  const response = await searchService(query);
  if (!response || response.length === 0) {
    return ApiResponse.success(res, [], 'No results found');
  }
  return ApiResponse.success(res, response, 'Search results retrieved successfully');
});

module.exports = {
  search,
};
