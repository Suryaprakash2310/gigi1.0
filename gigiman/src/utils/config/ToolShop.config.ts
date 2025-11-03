export interface ToolShopDomain {
    id: string;
    title: string;
    icon: any;
}
export const ToolShopDomainConfig: ToolShopDomain[] = [
    { id: 'HARDWARE_SHOP', title: 'Hardware shop', icon: require('../../../assets/icons/construction.png') },
    { id: 'eLECTRICAL_SHOP', title: 'Electrical shop', icon: require('../../../assets/icons/home_cleaning.png') },
    { id: 'PLUMBING_SHOP', title: 'Plumbing shop', icon: require('../../../assets/icons/plumbing.png') },
]
  