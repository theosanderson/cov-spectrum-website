import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import Header from './Header';
import { LoginWrapper } from './helpers/app-layout';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { useResizeDetector } from 'react-resize-detector';
import { Alert, AlertVariant } from './helpers/ui';
import { StoryOverviewPage } from './pages/StoryOverviewPage';
import { WasteWaterStoryPage } from './models/wasteWater/story/WasteWaterStoryPage';
import { WasteWaterLocationPage } from './models/wasteWater/story/WasteWaterLocationPage';
import { baseLocation } from './index';
import StoriesOverview from './stories/StoriesOverview';
import StoryRouter from './stories/StoryRouter';
import { defaultDateRange, defaultSamplingStrategy } from './helpers/explore-url';
import dayjs from 'dayjs';
import { getCurrentLapisDataVersionDate } from './data/api-lapis';
import { sequenceDataSource } from './helpers/sequence-data-source';
import { ExternalLink } from './components/ExternalLink';
import styled from 'styled-components';
import { ExplorePage } from './pages/ExplorePage';
import { DeepInternationalComparisonPage } from './pages/DeepInternationalComparisonPage';
import { DeepChen2021FitnessPage } from './pages/DeepChen2021FitnessPage';
import { DeepHospitalizationDeathPage } from './pages/DeepHospitalizationDeathPage';
import { DeepWastewaterPage } from './pages/DeepWastewaterPage';
import { DeepSequencingCoveragePage } from './pages/DeepSequencingCoveragePage';
import { FocusPage } from './pages/FocusPage';

const isPreview = !!process.env.REACT_APP_IS_VERCEL_DEPLOYMENT;

const Footer = styled.footer`
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px solid darkgray;
  font-size: small;
`;

export const App = () => {
  const { width, ref } = useResizeDetector<HTMLDivElement>();
  const isSmallScreen = width !== undefined && width < 768;

  return (
    <div className='w-full'>
      <div className='h-32 md:h-20'>
        <Header />
      </div>
      <div ref={ref} className='w-full'>
        {isPreview && (
          <Alert variant={AlertVariant.WARNING}>
            <div className='text-center font-bold'>
              Note: This is a preview deployment. Please visit{' '}
              <a href='https://cov-spectrum.org'>https://cov-spectrum.org</a> for the official website.
            </div>
          </Alert>
        )}
        <Switch>
          <Route exact path='/'>
            <Redirect to={`/explore/${baseLocation}/${defaultSamplingStrategy}/${defaultDateRange}`} />
          </Route>
          <Route path='/login'>
            <LoginWrapper>
              <LoginPage />
            </LoginWrapper>
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange'>
            <ExplorePage isSmallScreen={isSmallScreen} />
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange/sequencing-coverage'>
            <DeepSequencingCoveragePage />
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange/variants'>
            <FocusPage isSmallScreen={isSmallScreen} />
          </Route>
          <Route
            exact
            path='/explore/:country/:samplingStrategy/:dateRange/variants/international-comparison'
          >
            <DeepInternationalComparisonPage />
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange/variants/hospitalization-death'>
            <DeepHospitalizationDeathPage />
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange/variants/waste-water'>
            <DeepWastewaterPage />
          </Route>
          <Route exact path='/explore/:country/:samplingStrategy/:dateRange/variants/chen-2021-fitness'>
            <DeepChen2021FitnessPage />
          </Route>
          <Route exact path='/story'>
            <StoryOverviewPage />
          </Route>
          <Route exact path='/story/wastewater-in-switzerland'>
            <WasteWaterStoryPage />
          </Route>
          <Route exact path='/stories/wastewater-in-switzerland'>
            <WasteWaterStoryPage />
          </Route>
          <Route path='/story/wastewater-in-switzerland/location/:location'>
            <WasteWaterLocationPage />
          </Route>
          <Route path='/stories/wastewater-in-switzerland/location/:location'>
            <WasteWaterLocationPage />
          </Route>
          <Route exact path='/stories'>
            <StoriesOverview />
          </Route>
          <Route path='/stories/:storyId'>
            <StoryRouter />
          </Route>
          <Route path='/about'>
            <AboutPage />
          </Route>
        </Switch>
      </div>
      <Footer className='text-center'>
        <div>The sequence data was updated: {dayjs(getCurrentLapisDataVersionDate()).calendar()}</div>
        {sequenceDataSource === 'gisaid' && (
          <div>
            Data obtained from GISAID that is used in this Web Application remain subject to GISAID’s{' '}
            <ExternalLink url='http://gisaid.org/daa'>Terms and Conditions</ExternalLink>.
          </div>
        )}
        <div className='flex flex-wrap justify-center items-center my-4 mt-8'>
          <ExternalLink url='https://ethz.ch'>
            <img className='h-5 mx-6' alt='ETH Zurich' src='/img/ethz.png' />
          </ExternalLink>
          <ExternalLink url='https://www.sib.swiss/'>
            <img className='h-7 mx-6' alt='SIB Swiss Institute of Bioinformatics' src='/img/sib.svg' />
          </ExternalLink>
          <ExternalLink url='https://vercel.com/?utm_source=cov-spectrum&utm_campaign=oss'>
            <img className='h-6 mx-6' alt='Powered by Vercel' src='/img/powered-by-vercel.svg' />
          </ExternalLink>
        </div>
      </Footer>
    </div>
  );
};
