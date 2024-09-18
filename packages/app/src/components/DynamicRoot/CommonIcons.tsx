import Home from '@mui/icons-material/HomeOutlined';
import People from '@mui/icons-material/People';
import Category from '@mui/icons-material/CategoryOutlined';
import Extension from '@mui/icons-material/ExtensionOutlined';
import School from '@mui/icons-material/SchoolOutlined';
import AddCircle from '@mui/icons-material/AddCircleOutline';
import List from '@mui/icons-material/List';
import Layers from '@mui/icons-material/Layers';
import Star from '@mui/icons-material/Star';
import Favorite from '@mui/icons-material/Favorite';
import Bookmarks from '@mui/icons-material/BookmarksOutlined';
import QueryStats from '@mui/icons-material/QueryStatsOutlined';
import InsertChart from '@mui/icons-material/InsertChartOutlined';
import Business from '@mui/icons-material/BusinessOutlined';
import Storefront from '@mui/icons-material/StorefrontOutlined';
import FolderOpen from '@mui/icons-material/FolderOpenOutlined';
import Cloud from '@mui/icons-material/CloudOutlined';
import MonitorHeart from '@mui/icons-material/MonitorHeartOutlined';
import Textsms from '@mui/icons-material/TextsmsOutlined';
import Rule from '@mui/icons-material/RuleOutlined';
import GppGood from '@mui/icons-material/GppGoodOutlined';

const CommonIcons: {
  [k: string]: React.ComponentType<{}>;
} = {
  home: Home,
  group: People,
  category: Category,
  extension: Extension,
  school: School,
  add: AddCircle,
  list: List,
  layers: Layers,
  star: Star,
  favorite: Favorite,
  bookmarks: Bookmarks,
  queryStats: QueryStats,
  chart: InsertChart,
  business: Business,
  storefront: Storefront,
  folder: FolderOpen,
  cloud: Cloud,
  monitor: MonitorHeart,
  feedback: Textsms,
  validate: Rule,
  security: GppGood,
};

export default CommonIcons;
