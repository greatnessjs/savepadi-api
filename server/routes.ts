import authRoutes from "./services/user/route";
import thriftRoutes from "./services/thriftContribution/route";
import targetContributionRoutes from "./services/targetContribution/route";
import friendRoutes from "./services/friend/routes";
import messageRoutes from "./services/message/route";
import disputeRoutes from "./services/dispute/route";
import adminRoutes from "./services/admin/route";



const appRoutes = (app: any) => {
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/thrift', thriftRoutes);
    app.use('/api/v1/target', targetContributionRoutes);
    app.use('/api/v1/friend', friendRoutes);
    app.use('/api/v1/message', messageRoutes);
    app.use('/api/v1/dispute', disputeRoutes);
    app.use('/api/v1/admin', adminRoutes);
};

export default appRoutes;