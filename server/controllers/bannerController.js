const Banner = require("../models/Banner");

exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .populate("movieId", "title")
      .sort({ order: 1, createdAt: -1 });

    res.json(banners);
  } catch (error) {
    console.error("Error fetching active banners:", error);
    res.status(500).json({
      message: "Error fetching banners",
      error: error.message,
    });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .populate("movieId", "title")
      .sort({ order: 1, createdAt: -1 });

    res.json(banners);
  } catch (error) {
    console.error("Error fetching all banners:", error);
    res.status(500).json({
      message: "Error fetching banners",
      error: error.message,
    });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate(
      "movieId",
      "title"
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(banner);
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({
      message: "Error fetching banner",
      error: error.message,
    });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, bannerUrl, movieId, buttonText, order, isActive } =
      req.body;

    if (!title || !bannerUrl) {
      return res
        .status(400)
        .json({ message: "Title and bannerUrl are required" });
    }

    const banner = new Banner({
      title,
      subtitle: subtitle || "",
      bannerUrl,
      movieId: movieId || null,
      buttonText: buttonText || "Book Now",
      order: Number(order) || 0,
      isActive: isActive === "true" || isActive === true,
    });

    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({
      message: "Error creating banner",
      error: error.message,
    });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, subtitle, bannerUrl, movieId, buttonText, order, isActive } =
      req.body;

    const updateData = {
      title,
      subtitle: subtitle || "",
      movieId: movieId || null,
      buttonText: buttonText || "Book Now",
      order: Number(order) || 0,
      isActive: isActive === "true" || isActive === true,
    };

    if (bannerUrl) {
      updateData.bannerUrl = bannerUrl;
    }

    const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    res.status(500).json({
      message: "Error updating banner",
      error: error.message,
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      message: "Error deleting banner",
      error: error.message,
    });
  }
};