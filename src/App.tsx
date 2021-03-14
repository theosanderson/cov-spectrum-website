import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Header } from './Header';
import {
  ScrollableFullContentWrapper,
  HeaderWrapper,
  LoginWrapper,
  OuterWrapper,
} from './helpers/app-layout';
import { AboutPage } from './pages/AboutPage';
import { ExploreFocusSplit } from './pages/ExploreFocusSplit';
import { LoginPage } from './pages/LoginPage';
import { GlobalSamplePage } from './pages/GlobalSamplePage';
import { useSamplingStrategy } from './components/HeaderSamplingStrategySelect';
import { SamplingStrategy } from './services/api';

export const App = () => {
  const samplingStrategyProps = useSamplingStrategy();

  return (
    <OuterWrapper>
      <HeaderWrapper>
        <Header samplingStrategyProps={samplingStrategyProps} />
      </HeaderWrapper>

      <Switch>
        <Route exact path='/'>
          <Redirect to={`/explore/Switzerland/${SamplingStrategy.AllSamples}`} />
        </Route>
        <Route path='/variant'>
          {/* This is so that we don't break old bookmarked links */}
          <Redirect to='/' />
        </Route>
        <Route path='/login'>
          <LoginWrapper>
            <LoginPage />
          </LoginWrapper>
        </Route>
        <Route path='/explore/:country/:samplingStrategy'>
          <ExploreFocusSplit />
        </Route>
        <Route path='/global-samples'>
          <ScrollableFullContentWrapper>
            <GlobalSamplePage />
          </ScrollableFullContentWrapper>
        </Route>
        <Route path='/about'>
          <ScrollableFullContentWrapper>
            <AboutPage />
          </ScrollableFullContentWrapper>
        </Route>
      </Switch>
    </OuterWrapper>
  );
};
