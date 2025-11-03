export const SUBSERVICES: Record<string, { id: string; title: string,icon:any }[]> = {
  subServices: [
    { id: 'fan_install', title: 'Fan Installation', icon: require('../../../assets/icons/home_cleaning.png') },
    { id: 'fuse_repair', title: 'Fuse Repair',icon: require('../../../assets/icons/home_cleaning.png') },
    { id: 'switch_board', title: 'Switch Board Setup', icon: require('../../../assets/icons/home_cleaning.png')  },
  ],
  plumbing: [
    { id: 'pipe_fixing', title: 'Pipe Fixing', icon: require('../../../assets/icons/home_cleaning.png')  },
    { id: 'tap_install', title: 'Tap Installation', icon: require('../../../assets/icons/home_cleaning.png')  },
  ],
  home_cleaning: [
    { id: 'bathroom_cleaning', title: 'Bathroom Cleaning', icon: require('../../../assets/icons/home_cleaning.png')  },
    { id: 'floor_cleaning', title: 'Floor Cleaning', icon: require('../../../assets/icons/home_cleaning.png')  },
  ],
};
