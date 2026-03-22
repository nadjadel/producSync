import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ManufacturingOrders from './pages/ManufacturingOrders';
import Workstations from './pages/Workstations';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import DeliveryNotes from './pages/DeliveryNotes';
import Invoices from './pages/Invoices';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Login from './pages/Login';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Products": Products,
    "ManufacturingOrders": ManufacturingOrders,
    "Workstations": Workstations,
    "Stock": Stock,
    "Customers": Customers,
    "Orders": Orders,
    "DeliveryNotes": DeliveryNotes,
    "Invoices": Invoices,
    "Suppliers": Suppliers,
    "Users": Users,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
