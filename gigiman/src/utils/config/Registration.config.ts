import { UserRole } from "../enums/CommonEnum";

export const REGISTRATION_CATEGORIES = [
  { id: UserRole.SINGLE_EMPLOYEE, title: 'Single employee', icon: require('../../../assets/icons/singleEmp.png') },
  { id: UserRole.MULTI_EMPLOYEE, title: 'Multi employee', icon: require('../../../assets/icons/multiEmp.png') },
  { id: UserRole.TOOL_SHOP, title: 'Tool shop', icon: require('../../../assets/icons/toolshop.png') },
  // Add more categories as needed
];