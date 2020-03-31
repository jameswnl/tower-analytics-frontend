/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import moment from 'moment';

import { useQueryParams } from '../../Utilities/useQueryParams';
import LoadingState from '../../Components/LoadingState';
import NoData from '../../Components/NoData';
import EmptyState from '../../Components/EmptyState';
import { preflightRequest, readROI } from '../../Api';

import {
    Main,
    PageHeader,
    PageHeaderTitle
} from '@redhat-cloud-services/frontend-components';

import {
    Card,
    CardBody,
    CardHeader,
    InputGroup,
    InputGroupText,
    TextInput,
    Title,
    Grid,
    GridItem,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';

import {
    DollarSignIcon,
    InfoCircleIcon,
    OutlinedEyeIcon,
    OutlinedEyeSlashIcon
} from '@patternfly/react-icons';

import TopTemplatesSavings from '../../Charts/ROITopTemplates';

import {
    calculateDelta,
    convertSecondsToMins,
    convertMinsToSeconds,
    convertSecondsToHours
} from '../../Utilities/helpers';

let defaultAvgRunVal = 3600; // 1 hr in seconds

const InputAndText = styled.div`
  flex: 1;
`;

const TemplateDetail = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  div,
  em {
    padding-right: 5px;
  }

  @media (max-width: 1350px) {
    display: block;

    em {
      padding: 10px 0;
      display: block;
    }
  }
`;

const TemplateDetailSubTitle = styled.em`
  color: var(--pf-global--Color--dark-200);
`;

const TooltipWrapper = styled.div`
  p {
    text-align: left;
  }
`;

const IconGroup = styled.div`
  & svg {
    fill: var(--pf-global--Color--dark-200);

    :first-of-type {
      margin-right: 10px;
      margin-left: 10px;

      @media (max-width: 1350px) {
        margin-left: 0;
      }
    }
  }
`;
const title = (
    <span>
    Automation Analytics
        <span style={ { fontSize: '16px' } }>
            { ' ' }
            <span style={ { margin: '0 10px' } }>|</span> Automation Calculator
        </span>
    </span>
);

const initialQueryParams = {
    startDate: moment
    .utc()
    .subtract(3, 'months')
    .format('YYYY-MM-DD'),
    endDate: moment.utc().format('YYYY-MM-DD')
};

const AutomationCalculator = () => {
    const [ preflightError, setPreFlightError ] = useState(null);
    const [ unfilteredData, setUnfilteredData ] = useState([]);
    const [ formattedData, setFormattedData ] = useState([]);
    const [ templatesList, setTemplatesList ] = useState([]);
    const [ costManual, setCostManual ] = useState(0);
    const [ costAutomation, setCostAutomation ] = useState(0);
    const [ totalSavings, setTotalSavings ] = useState(0);
    const [ roiData, setRoiData ] = useState([]);
    const [ selectedIds, setSelectedIds ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(true);
    const { queryParams } = useQueryParams(initialQueryParams);

    // create our array to feed to D3
    const formatData = (response, defaults) => {
        return response.reduce(
            (
                formatted,
                {
                    name,
                    template_id: id,
                    successful_run_count,
                    successful_elapsed_sum,
                    successful_host_count_avg,
                    elapsed_sum,
                    failed_elapsed_sum,
                    org_name,
                    cluster_name
                }
            ) => {
                const avg_run = successful_elapsed_sum / successful_run_count;
                const total_hosts = Math.floor(
                    successful_host_count_avg * successful_run_count
                );
                formatted.push({
                    name,
                    id,
                    run_count: successful_run_count,
                    host_count: Math.ceil(successful_host_count_avg) || 0,
                    delta: 0,
                    isActive: true,
                    calculations: [
                        {
                            type: 'Manual',
                            avg_run: defaults,
                            total: defaults * total_hosts || 0
                        },
                        {
                            type: 'Automated',
                            avg_run: avg_run || 0,
                            total: successful_elapsed_sum * total_hosts || 0
                        }
                    ],
                    org_name,
                    cluster_name,
                    elapsed_sum,
                    failed_elapsed_sum
                });
                return formatted;
            },
            []
        );
    };

    useEffect(() => {
        const formatted = formatData(roiData, defaultAvgRunVal);
        setUnfilteredData(formatted);
        setFormattedData(formatted);
        setTemplatesList(formatted);
    }, [ roiData ]);

    useEffect(() => {
        const filteredData = unfilteredData.filter(
            ({ id }) => !selectedIds.includes(id)
        );
        templatesList.map(l => {
            if (selectedIds.includes(l.id)) {
                l.isActive = false;
            } else {
                l.isActive = true;
            }
        });
        setFormattedData(filteredData);
    }, [ selectedIds ]);

    useEffect(() => {
        let ignore = false;
        const getData = () => {
            return readROI({ params: queryParams });
        };

        async function initializeWithPreflight() {
            setIsLoading(true);
            await window.insights.chrome.auth.getUser();
            await preflightRequest().catch(error => {
                setPreFlightError({ preflightError: error });
            });
            getData().then(({ templates: roiData = []}) => {
                if (!ignore) {
                    setRoiData(roiData);
                    setIsLoading(false);
                }
            });
        }

        initializeWithPreflight();
        return () => (ignore = true);
    }, []);

    useEffect(() => {
        let data = [ ...formattedData ];
        let total = 0;
        data.forEach(datum => {
            total +=
        calculateDelta(
            convertSecondsToHours(datum.calculations[1].avg_run) * costAutomation,
            convertSecondsToHours(datum.calculations[0].avg_run) * costManual
        ) *
        datum.run_count *
        datum.host_count;
            datum.delta =
        calculateDelta(
            convertSecondsToHours(datum.calculations[1].avg_run) * costAutomation,
            convertSecondsToHours(datum.calculations[0].avg_run) * costManual
        ) *
        datum.run_count *
        datum.host_count;
        });
        const totalWithCommas = total
        .toFixed(2)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        setTotalSavings('$' + totalWithCommas);
    }, [ formattedData, costAutomation, costManual ]);

    const updateData = (seconds, id) => {
        let data = [ ...formattedData ];
        data.map(datum => {
            if (datum.id === id) {
                datum.calculations[0].avg_run = seconds;
                datum.calculations[0].total = seconds * datum.run_count;
            }
        });
        return data;
    };

    const handleManualTimeChange = (minutes, id) => {
        const seconds = convertMinsToSeconds(minutes);
        const updated = updateData(seconds, id);
        setFormattedData(updated);
    };

    const formatSelectedIds = (arr, id) => {
        let selected;
        if (arr.includes(id)) {
            selected = [ ...arr ].filter(s => s !== id);
        } else {
            selected = [ ...arr, id ];
        }

        return selected;
    };

    const handleToggle = id => {
        const currentSelection = [ ...selectedIds ];
        const newSelection = formatSelectedIds(currentSelection, id);
        setSelectedIds(newSelection);
    };

    return (
    <>
      <PageHeader style={ { flex: '0' } }>
          <PageHeaderTitle title={ title } />
      </PageHeader>
      {preflightError && (
          <Main>
              <Card>
                  <CardBody>
                      <EmptyState { ...preflightError } />
                  </CardBody>
              </Card>
          </Main>
      )}
      {!preflightError && (
          <Grid>
              <GridItem
                  span={ 8 }
                  style={ { display: 'flex', flexDirection: 'column' } }
              >
                  <Main style={ { paddingBottom: '0' } }>
                      <Card>
                          <CardHeader>Automation vs manual</CardHeader>
                          <CardBody>
                              { isLoading && !preflightError && <LoadingState /> }
                              { !isLoading && formattedData.length <= 0 && <NoData /> }
                              { formattedData.length > 0 && !isLoading && (
                                  <TopTemplatesSavings
                                      margin={ { top: 20, right: 20, bottom: 70, left: 70 } }
                                      id="d3-roi-chart-root"
                                      data={ formattedData }
                                      selected={ selectedIds }
                                  />
                              ) }
                          </CardBody>
                      </Card>
                  </Main>
                  <Main>
                      <Card style={ { height: '100%' } }>
                          <CardHeader>Automation formula</CardHeader>
                          <CardBody>
                              <p>
                    Your automation savings is calculated by the following
                    formula:
                              </p>
                              <p>
                                  <em>
                      S = &sum;fc<sub>m</sub>t - fc<sub>a</sub>t
                                  </em>
                              </p>
                              <p>
                    Lounge in doorway lick the other cats claws in your leg sit
                    on the laptop.
                              </p>
                          </CardBody>
                      </Card>
                  </Main>
              </GridItem>
              <GridItem span={ 4 }>
                  <Main style={ { paddingBottom: '0', paddingLeft: '0' } }>
                      <Card>
                          <CardHeader style={ { paddingBottom: '0' } }>
                  Total savings
                          </CardHeader>
                          <CardBody>
                              <Title
                                  headingLevel="h3"
                                  size="3xl"
                                  style={ { color: 'var(--pf-global--success-color--200)' } }
                              >
                                  { totalSavings }
                              </Title>
                          </CardBody>
                      </Card>
                  </Main>
                  <Main style={ { paddingBottom: '0', paddingLeft: '0' } }>
                      <Card>
                          <CardHeader style={ { paddingBottom: '10px' } }>
                  Calculate your automation
                          </CardHeader>
                          <CardBody>
                              <InputAndText>
                                  <p>Manual cost of automation</p>
                                  <em style={ { color: 'var(--pf-global--Color--dark-200)' } }>
                      (e.g. average salary of mid-level SE)
                                  </em>
                                  <InputGroup style={ { width: '50%' } }>
                                      <InputGroupText>
                                          <DollarSignIcon />
                                      </InputGroupText>
                                      <TextInput
                                          id="manual-cost"
                                          type="number"
                                          aria-label="manual-cost"
                                          value={ costManual }
                                          onChange={ e => setCostManual(e) }
                                      />
                                      <InputGroupText>/hr</InputGroupText>
                                  </InputGroup>
                              </InputAndText>
                              <InputAndText style={ { paddingTop: '10px' } }>
                                  <p>Cost of automation</p>
                                  <InputGroup style={ { width: '50%' } }>
                                      <InputGroupText>
                                          <DollarSignIcon />
                                      </InputGroupText>
                                      <TextInput
                                          id="automation-cost"
                                          type="number"
                                          aria-label="automation-cost"
                                          value={ costAutomation }
                                          onChange={ e => setCostAutomation(e) }
                                      />
                                      <InputGroupText>/hr</InputGroupText>
                                  </InputGroup>
                              </InputAndText>
                          </CardBody>
                      </Card>
                  </Main>
                  <Main style={ { paddingLeft: '0' } }>
                      <Card style={ { height: '39vh', overflow: 'auto' } }>
                          <CardHeader>Top templates</CardHeader>
                          <CardBody>
                              <p>
                    Enter the time it takes to run the following templates
                    manually.
                              </p>
                              { templatesList.map(data => (
                                  <div key={ data.id }>
                                      <p style={ { padding: '15px 0 10px' } }>{ data.name }</p>
                                      <TemplateDetail>
                                          <InputAndText key={ data.id }>
                                              <InputGroup>
                                                  <TextInput
                                                      id={ data.id }
                                                      type="number"
                                                      aria-label="time run manually"
                                                      value={ convertSecondsToMins(
                                                          data.calculations[0].avg_run
                                                      ) }
                                                      onChange={ e => {
                                                          handleManualTimeChange(e, data.id);
                                                      } }
                                                      isDisabled={ !data.isActive }
                                                  />
                                                  <InputGroupText>min</InputGroupText>
                                              </InputGroup>
                                          </InputAndText>
                                          <TemplateDetailSubTitle>
                          x { data.run_count } runs, { data.host_count } hosts
                                          </TemplateDetailSubTitle>
                                          <IconGroup>
                                              <Tooltip
                                                  position={ TooltipPosition.top }
                                                  entryDelay={ 50 }
                                                  exitDelay={ 50 }
                                                  content={
                                                      <TooltipWrapper>
                                                          <p>Elapsed sum: { data.elapsed_sum }s</p>
                                                          <p>
                                  Failed elapsed sum: { data.failed_elapsed_sum }s
                                                          </p>
                                                          <p>Org name: { data.org_name }</p>
                                                          <p>Cluster name: { data.cluster_name }</p>
                                                      </TooltipWrapper>
                                                  }
                                              >
                                                  <InfoCircleIcon />
                                              </Tooltip>
                                              { data.isActive === true && (
                                                  <OutlinedEyeIcon
                                                      onClick={ () => {
                                                          handleToggle(data.id);
                                                      } }
                                                  />
                                              ) }
                                              { data.isActive === false && (
                                                  <OutlinedEyeSlashIcon
                                                      onClick={ () => {
                                                          handleToggle(data.id);
                                                      } }
                                                  />
                                              ) }
                                          </IconGroup>
                                      </TemplateDetail>
                                  </div>
                              )) }
                          </CardBody>
                      </Card>
                  </Main>
              </GridItem>
          </Grid>
      )}
    </>
    );
};

export default AutomationCalculator;
