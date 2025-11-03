import { UserRole } from "../enums/CommonEnum";

export const REGISTRATION_CATEGORIES = [
  { id: UserRole.SINGLE_EMPLOYEE, title: 'Single employee',  icon: require('../../../assets/icons/chef.png') },
  { id: UserRole.MULTI_EMPLOYEE, title: 'Multi employee',  icon: require('../../../assets/icons/construction.png') },
  { id: UserRole.TOOL_SHOP, title: 'Tool shop',  icon: require('../../../assets/icons/home_cleaning.png') },
  // Add more categories as needed
];