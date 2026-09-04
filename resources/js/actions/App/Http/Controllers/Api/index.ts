import CommentController from './CommentController'
import LikeController from './LikeController'
import ImageController from './ImageController'
import PostController from './PostController'
import CategoryController from './CategoryController'
const Api = {
    CommentController: Object.assign(CommentController, CommentController),
LikeController: Object.assign(LikeController, LikeController),
ImageController: Object.assign(ImageController, ImageController),
PostController: Object.assign(PostController, PostController),
CategoryController: Object.assign(CategoryController, CategoryController),
}

export default Api