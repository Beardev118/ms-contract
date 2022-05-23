import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import { MULTISIG_ADDRESS } from "../../utils/accounts"
import { isTestNetwork } from "../../utils/network"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { get, deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const oldUSDPool = await get("metalUSDPool")
  const oldUSDPoolLPToken = await get("metalUSDPoolLPToken")
  const newUSDPool = await get("metalUSDPoolV2")
  const newUSDPoolLPToken = await get("metalUSDPoolV2LPToken")

  const DAI = await get("DAI")
  const USDC = await get("USDC")
  const USDT = await get("USDT")

  const usdDataStruct = {
    oldPoolAddress: oldUSDPool.address,
    oldPoolLPTokenAddress: oldUSDPoolLPToken.address,
    newPoolAddress: newUSDPool.address,
    newPoolLPTokenAddress: newUSDPoolLPToken.address,
    underlyingTokens: [DAI.address, USDC.address, USDT.address],
  }

  const owner = isTestNetwork(await getChainId()) ? deployer : MULTISIG_ADDRESS

  await deploy("SwapMigrator", {
    from: deployer,
    log: true,
    skipIfAlreadyDeployed: true,
    args: [usdDataStruct, owner],
  })
}
export default func
func.tags = ["SwapMigrator"]
func.dependencies = ["USDPoolV2"]
