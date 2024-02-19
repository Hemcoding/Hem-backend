import { asyncHandler } from "../utils/asyncHandler.js";
import { createApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw createApiError(
            500,
            `something went wrong while generating access and refresh token ${error}`
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;
    console.log(email);

    //     if(fullname === "") {
    //         throw new createApiError(400, "fullname is required")
    //     }
    if (
        [fullname, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw createApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw createApiError(409, "User with email or username already exist");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw createApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw createApiError(400, "Avatar is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw createApiError(500, "Something went wrong while creating User");
    }

    return res
        .status(201)

        .json(ApiResponse(200, createdUser, "User create successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    console.log(email, username, password);

    if (!(username || email)) {
        throw createApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    console.log(user);

    if (!user) {
        throw createApiError(404, "user does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    console.log(isPasswordValid);

    if (!isPasswordValid) {
        throw createApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );
});

export { registerUser, loginUser, logoutUser };
