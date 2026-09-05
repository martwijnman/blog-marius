import PostViewController from './PostViewController'
import Api from './Api'
import AnalyticsController from './AnalyticsController'
import Settings from './Settings'
const Controllers = {
    PostViewController: Object.assign(PostViewController, PostViewController),
Api: Object.assign(Api, Api),
AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers