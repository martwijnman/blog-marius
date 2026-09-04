import PostViewController from './PostViewController'
import Api from './Api'
import Settings from './Settings'
const Controllers = {
    PostViewController: Object.assign(PostViewController, PostViewController),
Api: Object.assign(Api, Api),
Settings: Object.assign(Settings, Settings),
}

export default Controllers