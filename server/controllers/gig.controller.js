const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const { uploadBuffer } = require('../utils/uploadToCloudinary');

const createGig = async (req, res, next) => {
  try {
    const { title, description, category, basePrice, deliveryDays, tags } = req.body;

    // Handle tags if they come as a comma-separated string (e.g. from FormData)
    let parsedTags = [];
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) parsedTags = parsed;
        else parsedTags = tags.split(',').map(tag => tag.trim()).filter(t => t);
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(t => t);
      }
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }

    // Upload images to Cloudinary in parallel
    let portfolioImages = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadBuffer(file.buffer, 'gigs'));
      portfolioImages = await Promise.all(uploadPromises);
    }

    const gig = new Gig({
      studentId: req.user.id, // Assuming req.user is set by auth middleware
      title,
      description,
      category,
      basePrice: Number(basePrice),
      deliveryDays: Number(deliveryDays),
      tags: parsedTags,
      portfolioImages
    });

    await gig.save();

    res.status(201).json({ success: true, data: gig });
  } catch (error) {
    next(error);
  }
};

const getGigs = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, maxDays, maxDeliveryDays, sort, page = 1, limit = 10 } = req.query;
    const effectiveMaxDays = maxDays || maxDeliveryDays; // support both param names
    
    let query = { status: 'active' }; // Only show active gigs

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (category) query.category = category;
    
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    if (effectiveMaxDays) query.deliveryDays = { $lte: Number(effectiveMaxDays) };

    // Sorting
    let sortOption = { createdAt: -1 }; // Default sort
    if (sort === 'price_asc') sortOption = { basePrice: 1 };
    if (sort === 'price_desc') sortOption = { basePrice: -1 };
    if (sort === 'rating_desc') sortOption = { avgRating: -1 };
    // If text search, sort by score
    if (search && !sort) {
       sortOption = { score: { $meta: "textScore" } };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    let gigsQuery = Gig.find(query);
    if (search && !sort) {
        gigsQuery = gigsQuery.select({ score: { $meta: "textScore" } });
    }

    const gigs = await gigsQuery
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('studentId', 'name avatar avgRating createdAt')
      .lean(); // use lean() to get plain objects

    // Expose `student` alias matching frontend expectations
    const gigsWithStudentAlias = gigs.map(g => ({ ...g, student: g.studentId }));

    const total = await Gig.countDocuments(query);

    res.status(200).json({
      success: true,
      data: gigsWithStudentAlias,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getGigById = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('studentId', 'name avatar avgRating createdAt');

    if (!gig || gig.status === 'deleted') {
      return next(new ApiError(404, 'Gig not found'));
    }

    // Convert to plain object and expose `student` alias so frontend
    // can use both gig.student and gig.studentId
    const gigObj = gig.toObject();
    gigObj.student = gigObj.studentId;

    res.status(200).json({ success: true, data: gigObj });
  } catch (error) {
    next(error);
  }
};


const updateGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig || gig.status === 'deleted') {
      return next(new ApiError(404, 'Gig not found'));
    }

    // Check ownership
    if (gig.studentId.toString() !== req.user.id.toString()) {
      return next(new ApiError(403, 'Not authorized to update this gig'));
    }

    // Fields to update
    const { title, description, category, basePrice, deliveryDays, tags, existingImages, status } = req.body;
    
    // Handle existing images (from frontend, might be sent as JSON string or array)
    let currentImages = [];
    if (existingImages) {
        try {
            currentImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        } catch(e) {
            currentImages = existingImages;
        }
    } else {
        currentImages = gig.portfolioImages; // keep all if not specified
    }

    // Handle new image uploads
    let newPortfolioImages = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadBuffer(file.buffer, 'gigs'));
      newPortfolioImages = await Promise.all(uploadPromises);
    }

    // Combine existing and new images (up to 5)
    const updatedImages = [...currentImages, ...newPortfolioImages].slice(0, 5);

    // Handle tags
    let parsedTags = tags || gig.tags;
    if (typeof tags === 'string') {
        try {
            parsedTags = JSON.parse(tags);
        } catch(e) {
            parsedTags = tags.split(',').map(tag => tag.trim());
        }
    }

    const updatedData = {
      title: title || gig.title,
      description: description || gig.description,
      category: category || gig.category,
      basePrice: basePrice ? Number(basePrice) : gig.basePrice,
      deliveryDays: deliveryDays ? Number(deliveryDays) : gig.deliveryDays,
      tags: parsedTags,
      portfolioImages: updatedImages,
      ...(status && { status }), // only update status if provided
    };

    const updatedGig = await Gig.findByIdAndUpdate(req.params.id, updatedData, {
      new: true,
      runValidators: true
    }).populate('studentId', 'name avatar avgRating');

    res.status(200).json({ success: true, data: updatedGig });
  } catch (error) {
    next(error);
  }
};

const deleteGig = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.id);

    if (!gig || gig.status === 'deleted') {
      return next(new ApiError(404, 'Gig not found'));
    }

    // Check ownership
    if (gig.studentId.toString() !== req.user.id.toString()) {
      return next(new ApiError(403, 'Not authorized to delete this gig'));
    }

    // Soft delete
    gig.status = 'deleted';
    await gig.save();

    res.status(200).json({ success: true, message: 'Gig deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getMyGigs = async (req, res, next) => {
  try {
    const gigs = await Gig.find({ 
        studentId: req.user.id,
        status: { $ne: 'deleted' } 
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: gigs });
  } catch (error) {
    next(error);
  }
};

const getPopularTags = async (req, res, next) => {
  try {
    const tags = await Gig.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.status(200).json({ success: true, data: tags.map(t => t._id) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  getMyGigs,
  getPopularTags
};
