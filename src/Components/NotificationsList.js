import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {
    DataList,
    DataListItem as PFDataListItem,
    DataListCell as PFDataListCell,
    FormSelect,
    FormSelectOption
} from '@patternfly/react-core';

import { WarningTriangleIcon } from '@patternfly/react-icons';
import LoadingState from '../Components/LoadingState';

const DataListCell = styled(PFDataListCell)`
    --pf-c-data-list__cell-cell--MarginRight: 0;
    &.pf-c-data-list__cell {
        padding: 0;
        display: flex;
        align-items: center;
    }
`;

const DataListItem = styled(PFDataListItem)`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 10px 15px;
`;

const DataCellEnd = styled(DataListCell)`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;
const colors = { error: '#db524b', warning: '#f0ad37', '': '' };

const NotificationTemplate = ({ notifications }) =>
    notifications.map(({ date, message, label, notification_id: id }) => (
        <DataListItem
            aria-labelledby="notifications-detail"
            key={ date + '-' + id }
        >
            <DataListCell>
                <span>
                    { label === 'error' ||
          label === 'warning' ? (
                            <WarningTriangleIcon
                                style={ {
                                    color: colors[label],
                                    marginRight: '5px'
                                } }
                            />
                        ) : null }
                    { message }
                </span>
            </DataListCell>
        </DataListItem>
    ));

const ErrorNotificationTemplate = ({ notifications }) =>
    notifications
    .filter(notification => notification.label === 'error')
    .map(({ date, label, message, notification_id: id }) => (
        <DataListItem
            aria-labelledby="notifications-detail"
            key={ date + '-' + id }
        >
            <DataListCell>
                <span>
                    { label === 'error' ||
            label === 'warning' ? (
                            <WarningTriangleIcon
                                style={ {
                                    color: colors[label],
                                    marginRight: '5px'
                                } }
                            />
                        ) : null }
                    { message }
                </span>
            </DataListCell>
        </DataListItem>
    ));

const NotificationsList = ({
    filterBy,
    onNotificationChange,
    options,
    notifications
}) => (
    <DataList style={ { flex: '1' } } aria-label="Notifications List">
        <DataListItem aria-labelledby="notifications-header">
            <DataListCell>
                <h3>Notifications</h3>
            </DataListCell>
            <DataCellEnd>
                <FormSelect
                    name="selectedNotification"
                    value={ filterBy }
                    onChange={ onNotificationChange }
                    aria-label="Select Notification Type"
                    style={ { margin: '2px 10px' } }
                >
                    { options.map(({ disabled, value, label }, index) => (
                        <FormSelectOption
                            isDisabled={ disabled }
                            key={ index }
                            value={ value }
                            label={ label }
                        />
                    )) }
                </FormSelect>
            </DataCellEnd>
        </DataListItem>
        { notifications.length <= 0 && (
            <LoadingState />
        ) }
        { filterBy === 'all' && (
            <NotificationTemplate notifications={ notifications } />
        ) }
        { filterBy === 'error' && (
            <ErrorNotificationTemplate notifications={ notifications } />
        ) }
    </DataList>
);

NotificationTemplate.propTypes = {
    notifications: PropTypes.array
};

NotificationsList.propTypes = {
    notifications: PropTypes.array,
    options: PropTypes.array,
    filterBy: PropTypes.string,
    onNotificationChange: PropTypes.func
};

export default NotificationsList;
