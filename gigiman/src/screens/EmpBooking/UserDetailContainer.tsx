import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme/theme';

interface UserDetailContainerProps {
  name: string;
  serviceCategoryName: string;
  cost: string;
  advancePaid?: string;
  remainingAmount?: string;
  durationInMinutes?: string;
  employeeCount: string;
  address: string;
}

export const UserDetailContainer = ({
  name,
  serviceCategoryName,
  cost,
  advancePaid,
  remainingAmount,
  durationInMinutes,
  employeeCount,
  address,
}: UserDetailContainerProps) => {
  const details = [
    { label: 'Name', value: name },
    { label: 'Work', value: serviceCategoryName },
    { label: 'Total Cost', value: cost },
    ...(advancePaid ? [{ label: 'Advance Paid', value: advancePaid }] : []),
    ...(remainingAmount ? [{ label: 'Remaining Amount', value: remainingAmount }] : []),
    ...(durationInMinutes ? [{ label: 'Working Hours', value: durationInMinutes }] : []),
    { label: 'Employee Count', value: employeeCount },
    { label: 'Address', value: address },
  ];

  return (
    <View style={styles.container}>
      {details.map((item, index) => (
        <View style={styles.row} key={index}>
          <Text style={styles.key}>{item.label}:</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const { width } = Dimensions.get('window');
const scale = width / 375; // base scaling for standard mobile width

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10 * scale,
    paddingHorizontal: 26 * scale,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8 * scale,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4 * scale,
    flexWrap: 'wrap',
  },
  key: {
    fontSize: 14 * scale,
    //fontWeight: '600',
    color: theme.colors.text,
    flexShrink: 1,
  },
  value: {
    fontSize: 14 * scale,
    fontWeight: '600',
    color: '#555',
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
});
