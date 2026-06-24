import Home from './pages/Home';
import Buildings from './pages/Buildings';
import Apartments from './pages/Flats';
import DowntownPerks from './pages/DowntownPerks';
import Dashboard from './pages/Dashboard';
import Reminders from './pages/Reminders';
import Tenants from './pages/Tenants';
import Settings from './pages/Settings';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Buildings": Buildings,
    "Dashboard": Dashboard,
    "Apartments": Apartments,
    "Reminders": Reminders,
    "Tenants": Tenants,
    "Settings": Settings,
    "About": About,
    "DowntownPerks": DowntownPerks,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};